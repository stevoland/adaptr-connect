'use strict';

var browserify = require('browserify');
var cookie = require('cookie');
var debug = require('debug')('adaptr:log');
var error = require('debug')('adaptr:error');
var interpolate = require('interpolate');
var url = require('url');
var objectAssign = require('object-assign');
var querystring = require('querystring');

var Profile = require('./lib/Profile');

var defaultOptions = {
  timeout: 1000,
  cookieName: 'adaptr',
  cookieMaxAge: 1000 * 60 * 60,
  cookiePath: '/',
  serverPath: '/adaptr',
  clientVarName: 'adaptr',
  profileModelPath: './lib/Profile'
};

var defaultStartHead = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8"/>';

var adaptr = function (options) {
  var uidHelper = 0;
  var pendingRequests = {};

  options = objectAssign(defaultOptions, options);

  function resolveRequest (id, profile) {
    if (pendingRequests[id]) {
      clearTimeout(pendingRequests[id].timeout);
      pendingRequests[id].callback(profile);
      debug('Resolved request', id);
    }

    delete pendingRequests[id];
  }

  function pauseRequest (continueCallback, timeoutPeriod) {
    var id = uidHelper;

    uidHelper += 1;

    pendingRequests[id] = {
      timeout: setTimeout(function () {
          debug('Timedout request', id);
          resolveRequest(id, new Profile());
        }, timeoutPeriod),
      callback: continueCallback
    };

    debug('Paused request', id);

    return id;
  }

  function getClientMarkup (requestId, options, callback) {
    var b = browserify(null, {
      basedir: __dirname
    });

    Object.keys(options.detect).forEach(function (key) {
      b.require(options.detect[key].test + '.js', {
        expose: options.detect[key].test
      });
    });

    b.require(options.profileModelPath + '.js', {
      expose: './lib/Profile'
    });

    b.add(['./lib/client/client']);

    b.bundle(function (err, buffer) {
      var markup = '';

      if (err) {
        error(err);
        markup = '<!-- adaptr: An error occured generating the client bundle, check the log -->';
      } else {
        markup = '<script>' + buffer.toString() + '</script>';

        if (options.requestBeacon) {
          markup += '<noscript>' +
            '<link href="{serverPath}.css?id={requestId}" rel="stylesheet" />' +
            '</noscript>';
        }

        markup = interpolate(markup, {
          requestId: requestId,
          serverPath: options.serverPath,
          cookieName: options.cookieName,
          cookiePath: options.cookiePath,
          cookieMaxAge: options.cookieMaxAge,
          requestBeacon: options.requestBeacon ? '1' : '',
          detect: JSON.stringify(options.detect),
          data: JSON.stringify(options.data),
          clientVarName: options.clientVarName
        });
      }

      callback(err, markup);
    });
  }

  function getCookieData (req, cookieName) {
    var cookies = cookie.parse(req.headers.cookie || '');
    var cookieValue = cookies[cookieName];
    var data;

    if (cookieValue) {
      try {
        data = JSON.parse(cookieValue);
      } catch (e) {}
    }

    return data;
  }

  function serveBeacon (req, res) {
    var data;
    var query;

    res.writeHead(200, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': (/\.css$/.test(req.path)) ?
        'text/css' : 'text/javascript'
    });
    res.end('');

    var info = url.parse(req.url);
    if (info && info.query) {
      query = querystring.parse(info.query);

      data = getCookieData(req, options.cookieName);

      var profile = new Profile(data);
      resolveRequest(query.id, profile);
    }
  }

  return {
    middleware: function (startHead, routeCallback) {
      return function (req, res, next) {
        var data;
        var requestId;
        var scriptOptions;

        if (req.path.indexOf(options.serverPath + '.js') === 0 ||
            req.path.indexOf(options.serverPath + '.css') === 0) {
          serveBeacon(req, res);
          return;
        }

        var callback = function (profile) {
          routeCallback(req, res, next, profile);
        };

        data = getCookieData(req, options.cookieName);

        if (!data) {
          requestId = pauseRequest(callback, options.timeout);
        }

        if (routeCallback) {
          startHead(req, res);
        } else {
          routeCallback = startHead;
          res.write(defaultStartHead);
        }

        scriptOptions = {
          serverPath: options.serverPath,
          cookieName: options.cookieName,
          cookiePath: options.cookiePath,
          cookieMaxAge: options.cookieMaxAge,
          detect: options.detect,
          data: data,
          requestBeacon: !data,
          clientVarName: options.clientVarName
        };

        getClientMarkup(requestId, scriptOptions, function (err, markup) {
          res.write(markup);

          if (data || err) {
            callback(new Profile(data));
          }
        });
      };
    }
  };
};

module.exports = adaptr;

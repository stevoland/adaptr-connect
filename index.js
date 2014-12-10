'use strict';

var browserify = require('browserify');
var cookie = require('cookie');
var debug = require('debug')('adaptr');
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
  clientVarName: 'adaptr'
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
      debug('Resolved request: ' + id);
    }

    delete pendingRequests[id];
  }

  function pauseRequest (continueCallback, timeoutPeriod) {
    var id = uidHelper;

    uidHelper += 1;

    pendingRequests[id] = {
      timeout: setTimeout(function () {
          resolveRequest(id, new Profile());
        }, timeoutPeriod),
      callback: continueCallback
    };

    debug('Paused request: ' + id);

    return id;
  }

  function getClientMarkup (requestId, options, callback) {
    var b = browserify(['./lib/client/client'], {
      basedir: __dirname
    });

    debug(options.detect);
    Object.keys(options.detect).forEach(function (key) {
      b.require(options.detect[key].test);
    });

    b.bundle(function (err, buffer) {
      var markup = '';

      if (err) {
        debug(err);
      } else {
        markup = '<script>' + buffer.toString() + '</script>';

        if (options.requestBeacon) {
          markup += '<noscript>' +
            '<link href="{serverPath}.css?id={requestId}" rel="stylesheet" />' +
            '<noscript>';
        }

        markup = interpolate(markup, {
          requestId: requestId,
          serverPath: options.serverPath,
          cookieName: options.cookieName,
          cookiePath: options.cookiePath,
          cookieMaxAge: options.cookieMaxAge,
          requestBeacon: options.requestBeacon ? '1' : '',
          detect: JSON.stringify(options.detect)
        });
      }

      callback(markup);
    });
  }

  function serveBeacon (req, res) {
    var data;

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
      var query = querystring.parse(info.query);

      try {
        data = JSON.parse(query.profile);
      } catch (e) {}

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

        var cookies = cookie.parse(req.headers.cookie || '');
        var cookieValue = cookies[options.cookieName];

        var callback = function (profile) {
          routeCallback(req, res, next, profile);
        };

        if (cookieValue) {
          try {
            data = JSON.parse(cookieValue);
          } catch (e) {}
        }

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
          requestBeacon: !data
        };

        getClientMarkup(requestId, scriptOptions, function (markup) {
          res.write(markup);

          if (data) {
            callback(new Profile(data));
          }
        });
      };
    }
  };
};

module.exports = adaptr;

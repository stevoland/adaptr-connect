'use strict';

var fs = require('fs');
var url = require('url');
var querystring = require('querystring');
var objectAssign = require('object-assign');
var interpolate = require('interpolate');
var cookie = require('cookie');
var path = require('path');
var Profile = require('./lib/Profile');
var debug = require('debug')('adaptr');

var defaultOptions = {
  timeout: 1000,
  cookieName: 'adaptr',
  cookieMaxAge: 1000 * 60 * 60,
  cookiePath: '/',
  serverPath: '/adaptr'
};

var clientTemplate = fs.readFileSync(path.join(__dirname, 'client.html'), 'UTF-8');

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

  function getClientMarkup (clientTemplate, requestId, options) {
    if (requestId == null) {
      return '';
    }

    return interpolate(clientTemplate, {
      requestId: requestId,
      serverPath: options.serverPath,
      cookieName: options.cookieName,
      cookiePath: options.cookiePath,
      cookieMaxAge: options.cookieMaxAge
    });
  }

  return {
    middleware: function (startHead, routeCallback) {
      return function (req, res, next) {
        var data;
        var requestId;

        if (req.path.indexOf(options.serverPath + '.js') === 0 ||
            req.path.indexOf(options.serverPath + '.css') === 0) {
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

          return;
        }

        var cookies = cookie.parse(req.headers.cookie);
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

        startHead(req, res);
        res.write(getClientMarkup(clientTemplate, requestId, options));

        if (data) {
          callback(new Profile(data));
        }
      };
    }
  };
};

adaptr.tests = require('./lib/tests');
adaptr.updaters = require('./lib/updaters');

module.exports = adaptr;

"use strict";

var fs = require('fs');
var url = require('url');
var querystring = require('querystring');
var objectAssign = require('object-assign');
var interpolate = require('interpolate');
var Profile = require('./lib/Profile');
var debug = require('debug')('adaptr');

var defaultOptions = {
  timeout: 1000,
  serverPath: '/adaptr'
};

var clientTemplate = fs.readFileSync('client.html', 'UTF-8');

var defaultStartHead = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8"/>';

var adaptr = function (options) {
  var uidHelper = 0;
  var pendingRequests = {};

  options = objectAssign(defaultOptions, options);

  function resolveRequest (id, profile) {
    if (pendingRequests[id]) {
      pendingRequests[id](profile);
    }

    delete pendingRequests[id];
  }

  function pauseRequest (continueCallback, timeout) {
    var id = uidHelper;

    uidHelper += 1;

    pendingRequests[id] = continueCallback;

    setTimeout(function () {
      resolveRequest(id);
    }, timeout);

    return id;
  }

  function getClientMarkup (clientTemplate, serverPath, requestId) {
    return interpolate(clientTemplate, {
      requestId: requestId,
      serverPath: serverPath
    });
  }

  return {
    middleware: function (startHead, routeCallback) {
      return function (req, res, next) {
        if (req.path.indexOf(options.serverPath) === 0) {
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
            var data;

            try {
              data = JSON.parse(query.profile);
            } catch (e) {}

            var profile = new Profile(data);
            resolveRequest(query.id, profile);
          }

          return;
        }

        var requestId = pauseRequest(function (profile) {
          routeCallback(req, res, next, profile);
        }, options.timeout);

        if (routeCallback) {
          startHead(req, res);
        } else {
          routeCallback = startHead;
          res.write(defaultStartHead);
        }
        startHead(req, res);
        res.write(getClientMarkup(clientTemplate, options.serverPath, requestId));
      };
    }
  };
};

adaptr.tests = require('./lib/tests');
adaptr.updaters = require('./lib/updaters');

module.exports = adaptr;

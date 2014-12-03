"use strict";

var fs = require('fs');
var url = require('url');
var querystring = require('querystring');
var objectAssign = require('object-assign');
var debug = require('debug')('adaptr');

var defaultOptions = {
  timeout: 1000,
  serverPath: '/adaptr'
};

var clientTemplate = fs.readFileSync('client.js', 'UTF-8');

var defaultStartHead = '<!DOCTYPE html><html><head><meta charset="utf-8"/>';

module.exports = function (options) {
  var uidHelper = 0;
  var pendingRequests = {};

  options = objectAssign(defaultOptions, options);

  function resolveRequest (id, data) {
    if (pendingRequests[id]) {
      pendingRequests[id]();
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
    clientTemplate = clientTemplate
      .replace(/{{requestId}}/g, requestId)
      .replace(/{{serverPath}}/g, serverPath);

    return '<script>' + clientTemplate + '</script>';
  }

  return {
    middleware: function (startHead, routeCallback) {
      return function (req, res, next) {
        if (req.path === options.serverPath) {

          res.writeHead(200, {'Content-Type': 'text/javascript'});
          res.end('');

          var info = url.parse(req.url);
          if (info && info.query) {
            var query = querystring.parse(info.query);
            var id = query.id;
            delete query.id;

            resolveRequest(id, query);
          }
          next();
          return;
        }

        var requestId = pauseRequest(function () {
          routeCallback(req, res, next);
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

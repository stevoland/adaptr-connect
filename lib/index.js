'use strict';

var url = require('url');
var querystring = require('querystring');

var serverLib = require('adaptr-lib-server');

var defaultStartHead = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8"/>';

var adaptr = function (detects, options) {

  var instance = serverLib.getInstance(detects, options);
  var Profile = instance.getProfileClass();

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

      data = instance.getCookieData(req.headers.cookie);

      var profile = new Profile(data);
      instance.resolveRequest(query.id, profile);
    }
  }

  return {
    middleware: function (startHead, routeCallback) {
      return function (req, res, next) {
        var data;
        var requestId;
        var requestBeacon;

        if (instance.isBeaconPath(req.path)) {
          serveBeacon(req, res);
          return;
        }

        var callback = function (profile) {
          routeCallback(req, res, next, profile);
        };

        data = instance.getCookieData(req.headers.cookie);

        requestBeacon = !data && serverLib.hasClientTests(detects);

        if (requestBeacon) {
          requestId = instance.pauseRequest(callback, options.timeout);
        }

        if (routeCallback) {
          startHead(req, res);
        } else {
          routeCallback = startHead;
          res.write(defaultStartHead);
        }

        instance.getClientMarkup(requestId, data, function (err, markup) {
          res.write(markup);

          if (!requestBeacon || err) {
            callback(new Profile(data));
          }
        });
      };
    }
  };
};

module.exports = adaptr;

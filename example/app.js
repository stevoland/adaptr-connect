'use strict';

var express = require('express');
var app = express();
var favicon = require('serve-favicon');
var path = require('path');
var port = 4000;

var adaptr = require('../index');
var adaptrInstance = adaptr({
        viewportWidth: {
          defaultValue: 960,
          clientTest: 'adaptr-lib-detect/detect/viewportWidth',
          clientUpdate: 'adaptr-lib-detect/update/onWindowResize'
        },
        serverFeature: {
        }
      }, {
        timeout: 2000
      }
    );


var writeStartHead = function (req, res) {
  res.write('<!DOCTYPE html><html><head>');
};

var writeBody = function (req, res, next, profile) {
  res.write('</head>');
  res.write('<body>');
  res.write('<pre>' + JSON.stringify(profile) + '</pre>');
  res.end('</body></html>');
};

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.get(
  '*',
  adaptrInstance.middleware(
    writeStartHead,
    writeBody
  )
);

app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);

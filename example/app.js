'use strict';

var express = require('express');
var app = express();
var favicon = require('serve-favicon');
var fs = require('fs');
var path = require('path');
var port = 4000;

var adaptr = require('../index');
var adaptrInstance = adaptr({
    timeout: 5000,
    detect: {
      viewportWidth: {
        defaultValue: 960,
        test: './lib/tests/viewportWidth.js',
        update: './lib/updaters/viewportWidth'
      }
    }
});


var writeStartHead = function (req, res) {
  res.write('<!DOCTYPE html><html><head>');
};

var writeBody = function (req, res, next, profile) {
  res.write('</head>');
  res.write('<body>');
  res.write('<pre>' + profile.toJSON() + '</pre>');
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

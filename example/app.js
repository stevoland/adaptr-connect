'use strict';

var express = require('express');
var app = express();
var port = 4000;

var adaptr = require('../index');
var adaptrInstance = adaptr({
    timeout: 5000,
    detect: {
      viewportWidth: {
        defaultValue: 960,
        test: adaptr.tests.viewportWidth,
        update: adaptr.updaters.windowResize
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

app.get(
  '*',
  adaptrInstance.middleware(
    writeStartHead,
    writeBody
  )
);

app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);

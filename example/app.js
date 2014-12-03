'use strict';

var express = require('express');
var app = express();
var port = 4000;

var adaptr = require('../index');
var adaptrInstance = adaptr({
    timeout: 5000
});


var writeStartHead = function (req, res) {
  res.write('<!DOCTYPE html><html><head>');
};

var writeBody = function (req, res, next, profile) {
  res.write('</head>');
  res.write('<body>');
  res.write('test');
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

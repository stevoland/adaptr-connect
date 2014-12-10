/* globals document: false */
'use strict';

var adaptr = require('./adaptr');

var DURATION = '{cookieMaxAge}';
var PATH = '{cookiePath}';
var NAME = '{cookieName}';
var REQUEST_BEACON = !!'{requestBeacon}';
/*eslint-disable */
var DETECT = {detect};
/*eslint-enable */

var src;
var settings = {};

function setCookie (value) {
  var date = new Date();
  date.setTime(date.getTime() + DURATION);
  var expires = '; expires=' + date.toGMTString();
  document.cookie = NAME + '=' + value + expires + '; path=' + PATH;
}

function getSettings () {
  return JSON.stringify({
      viewportWidth: document.documentElement.clientWidth
    });
}

Object.keys(DETECT).forEach(function (key) {
  settings[key] = require(DETECT[key].test)(window));
});

if (REQUEST_BEACON) {
  setCookie(JSON.stringify(settings));

  src = '{serverPath}.js?id={requestId}&profile=' + encodeURIComponent(JSON.stringify(settings));

  document.write('<script src="' + src + '"></' + 'script>');
}

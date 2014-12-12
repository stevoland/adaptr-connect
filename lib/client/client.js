/*eslint-env browser */
'use strict';

var Adaptr = require('./Adaptr');
var cookie = require('./cookie');
var Profile = require('./lib/Profile');

var DURATION = '{cookieMaxAge}';
var PATH = '{cookiePath}';
var NAME = '{cookieName}';
var REQUEST_BEACON = !!'{requestBeacon}';
var CLIENT_VAR_NAME = '{clientVarName}';
/*eslint-disable */
var DETECT = {detect};
var INITIAL_DATA = {data};
/*eslint-enable */

var settings = {};
var adaptr;

Object.keys(DETECT).forEach(function (key) {
  settings[key] = DETECT[key].test ?
    require(DETECT[key].test)(window): DETECT[key].defaultValue;
});

if (REQUEST_BEACON) {
  cookie.set(
    NAME,
    JSON.stringify(settings),
    DURATION,
    PATH
  );

  document.write('<script src="{serverPath}.js?id={requestId}"></' + 'script>');
}

adaptr = new Adaptr(Profile, detect, INITIAL_DATA || settings);

window[CLIENT_VAR_NAME] = adaptr;

module.exports = adaptr;

/*eslint-env browser */
'use strict';

module.exports = {
  set: function (name, value, duration, path) {
    var date = new Date();
    date.setTime(date.getTime() + duration);
    var expires = '; expires=' + date.toGMTString();
    document.cookie = name + '=' + value + expires + '; path=' + path;
  }
};

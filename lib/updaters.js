'use strict';

var debounce = require('debounce');

module.exports = {
  windowResize: function (window, update) {
    window.addEventListener('resize', debounce(update, 250));
  }
};

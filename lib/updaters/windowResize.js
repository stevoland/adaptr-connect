'use strict';

var debounce = require('debounce');

module.exports = function (window, update) {
  window.addEventListener('resize', debounce(update, 250));
};

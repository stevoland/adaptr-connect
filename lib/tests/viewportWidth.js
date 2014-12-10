'use strict';

module.exports = function (w) {
  Math.max(w.document.documentElement.clientWidth, w.innerWidth || 0);
};

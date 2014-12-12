/*eslint-env browser */
'use strict';

module.exports = function (w) {
  return Math.max(w.document.documentElement.clientWidth, w.innerWidth || 0);
};

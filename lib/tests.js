'use strict';

module.exports = {
  viewportWidth: function (w) {
    Math.max(w.document.documentElement.clientWidth, w.innerWidth || 0);
  }
};

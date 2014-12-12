'use strict';

var Adaptr = function (ProfileClass, spec, data) {
  this._profile = new ProfileClass(data);
};

Adaptr.prototype.getProfile = function () {
  return this._profile;
};

Adaptr.prototype.resume = function () {
  return this._profile;
};



module.exports = Adaptr;

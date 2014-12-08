'use strict';

var Profile = function (data) {
  this.reset(data);
};

Profile.prototype.reset = function (data) {
  this._values = {};

  if (data) {
    for (var i in data) {
      if (data.hasOwnProperty(i)) {
        this.set(i, data[i]);
      }
    }
  }
};

Profile.prototype.get = function (key) {
  return this._values[key];
};

Profile.prototype.set = function (key, val) {
  this._values[key] = val;
  return this;
};

Profile.prototype.remove = function (key) {
  delete this._values[key];
  return this;
};

Profile.prototype.toJSON = function () {
  return JSON.stringify(this._values);
};

module.exports = Profile;

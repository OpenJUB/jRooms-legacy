'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PhaseSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Phase', PhaseSchema);
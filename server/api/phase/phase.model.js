'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PhaseSchema = new Schema({
  id: Number,
  name: String,
  from: Date,
  to: Date,
  isCollegePhase: Boolean,
  maxRooms: Number,
  next: Date,
  filters: Object,
  isCurrent: Boolean,
  isEligible: Boolean
});

module.exports = mongoose.model('Phase', PhaseSchema);
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RoomSchema = new Schema({
	name: String,
  college: String,
  block: String,
  floor: Number,
  type: String,
  rooms: Array
});

module.exports = mongoose.model('Room', RoomSchema);
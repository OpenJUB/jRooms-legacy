'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
	name : String,
	country : String,
	graduation_year : Number,
	roommates : Array,
	outbox : Array,
	inbox : Array,
	username : String,
	college : String,
	college_preference : Array,
	nextCollege : String,
	token: String,
	phaseId: Number,
	rooms: Array,
	nextRoom: String,
	points: Object,
	major: String,
	description: String,
	isAdmin: Boolean,
	imageURL: String
});

module.exports = mongoose.model('User', userSchema);
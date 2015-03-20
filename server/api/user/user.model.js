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
	round_name: String,
	room_preferences: Array,
	room_final: String,
	points: Object,
	major: String,
	description: String,
	isAdmin: Boolean,
	imageURL: String,
	hasFreshman: Boolean
});

module.exports = mongoose.model('User', userSchema);
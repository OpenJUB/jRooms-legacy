'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
	name : String,
	surname : String,
	country : String,
	graduation_year : Number,
	roommates : Array,
	outbox : Array,
	inbox : Array,
	username : String,
	eid: Number,
	college : String,
	college_preference : Array,
	next_college : String,
	token: String,
	is_tall: Boolean,
	is_exchange: Boolean,
	round_name: String,
	room_preferences: Array,
	room_final: String,
	points: String,
	major: String,
	description: String,
	isAdmin: Boolean,

});

module.exports = mongoose.model('User', userSchema);
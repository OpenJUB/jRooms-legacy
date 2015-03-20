'use strict';

var _ = require('lodash');
var User = require('./api/user/user.model');
var Phase = require('./api/phase/phase.model');
var Admin = require('./api/admin/admin.model');
var config = require('./config/environment');

exports.AddOpenJubUser = function(item, token, callback) {
	var user = new User({
	    name: item.fullName,
	    surname: item.lastName,
	    username: item.username,
	    eid: item.eid,
	    major: item.major,
	    description: item.description,
	    country: item.country,
	    graduation_year: item.year,
	    college: item.college,
	    isAdmin: (config.admins.indexOf(item.username) > -1),
	    imageURL: 'https://api.jacobs-cs.club/user/image/' + item.username + '/image.jpg',
	    token: token
    });

    user.save(callback);
}

exports.SetPhases = function(phases, callback) {
	Phase.find({}).remove().exec();

	for(var item in phases) {
		
		var tmp = new Phase({
			id: item.id,
			name: item.name,
			from: item.from,
			to: item.to,
			isCollegePhase: item.isCollegePhase,
			maxRooms: 7,
			next: item.next,
			filters: item.filters,
			isCurrent: false
		});
		tmp.save();
	}

	callback();
}

exports.updatePhases = function() {

	Admin.findOne({}).exec(function(err, settings) {
		if(err || !settings){
			console.log("PANIC");
			console.log(err);
		}

		if(settings.isDebug)
			return;

		Phase.find({}).exec(function(err2, data) {
			if(err2 || !data) {
				console.log("ANOTHER PANIC");
				console.log(err);
			}

			data.forEach(function(item) {
				item.isCurrent = (item.from <= (new Date()) && item.to >= (new Date()));
				item.save();
			});
		})
	});
	//Add if statement for limiting it to certain hours if necessary
}

setInterval(exports.updatePhases, 1000 * 7);
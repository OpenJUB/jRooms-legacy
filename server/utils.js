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
	    token: token,
	    points: {
	    	totalPoints: 0,
	    	userPoints: (new Date()).getFullYear() - 2000 - item.year + 3,
	    	roommatePoints: 0,
	    	collegeSpiritPoints: 0,
	    	countryPoints: 0,
	    	regionPoints: 0,
	    	majorPoints: 0
	    }
    });


	exports.points(user, function(err, updated) {
		if(err || !updated) {
			console.log("Poof");
		}

		updated.save(callback);
	});
}

exports.SetPhases = function(phases, callback) {
	Phase.find({}).remove().exec();

	console.log(phases);
	if(!phases)
		callback();

	for(var i = 0; i < phases.length; i++) {
		var item = phases[i];

		console.log(item);
		var tmp = new Phase({
			id: item.id,
			name: item.name,
			from: item.from,
			to: item.to,
			isCollegePhase: item.isCollegePhase,
			maxRooms: 7,
			next: item.next,
			filters: item.filters,
			isCurrent: false,
			results: item.results
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
				item.isDone = (item.to < new Date());
				item.save();
			});
		})
	});
	//Add if statement for limiting it to certain hours if necessary
}

exports.points = function(user, callback) {
	if(!user.points) {
		callback("Points not defined", user);
	}

	user.points.totalPoints = user.points.userPoints;

	user.points.collegeSpiritPoints = config.collegeSpiritPoints * (user.college === user.nextCollege);
	user.points.totalPoints += user.points.collegeSpiritPoints;

	if(user.roommates.length > 0) {

		var tmp = [];
		for(var i = 0; i < user.roommates.length; i++) {
			tmp.push(user.roommates[i].username);
		}

		User.find({username: {$in: tmp}}).exec(function(err, users) {
			if(err || !users) {
				callback(err, null);
			}

			var roommatePoints = 0;

			var countries = [user.country];
			var regions = [getRegion(user.country)];
			var majors = [user.major];

			for(var i = 0; i < users.length; i++) {
				roommatePoints += users[i].points.userPoints;
				countries.push(users[i].country);
				regions.push(getRegion(users[i].country));
				majors.push(users[i].major);
			}

			user.points.roommatePoints = roommatePoints;
			user.points.countryPoints = config.countryPoints * (countries.filter(exports.onlyUnique).length - 1);
			user.points.regionPoints = config.regionPoints * (regions.filter(exports.onlyUnique).length - 1);
			user.points.majorPoints = config.majorPoints * (majors.filter(exports.onlyUnique).length - 1);

			user.points.totalPoints += user.points.roommatePoints + user.points.countryPoints + user.points.regionPoints + user.points.majorPoints;

			//console.log(user);
			callback(null, user);
		});

	} else {
		//console.log(user);
		callback(null, user);
	}
}

var getRegion = function(country) {
	for(var property in config.regions) {
		if(config.regions.hasOwnProperty(property)) {
			if(config.regions[property].indexOf(country) >= 0) {
				return property;
			}
		}
	}

	return null;
}

exports.onlyUnique = function (value, index, self) { 
    return self.indexOf(value) === index;
}

exports.isEligible = function(item, round, callback) {
  var status = true;
  User.findOne({token: item}).exec(function(err, user) {
    if(err || !user) {
      status = false;
    }
    Admin.findOne({}).exec(function(err2, settings) {
      if(round.filters.enableFilterTall) {
        var tall = settings.tallPeople.split(',');
        status = Math.min((tall.indexOf(user.username) >= 0), status);
      }

      if(round.filters.enableFilterColleges) {
        var tmp = [];
        if(round.filters.colleges.krupp) {
          tmp.push("Krupp");
        }
        if(round.filters.colleges.mercator) {
          tmp.push("Mercator");
        }
        if(round.filters.colleges.c3) {
          tmp.push("C3");
        }
        if(round.filters.colleges.nordmetall) {
          tmp.push("Nordmetall");
        }

        status = Math.min((tmp.indexOf(user.nextCollege) >= 0), status);
      }

      if(round.filters.enableFilterExchange) {
        status = Math.min(user.isExchange, status);
      } else {
        status = Math.min(!user.isExchange, status);
      }

      if(round.filters.enableFilterPoints) {
        status = Math.min((user.points.total >= round.filters.pointsMin && user.points.total <= round.filters.pointsMax) ,status);
      }

      if(round.filters.enableFilterRooms) {
        var num = user.roommates.length + 1;
        status = Math.min(((round.filters.rooms.one && num === 1) || (round.filters.rooms.two && num === 2) || (round.filters.rooms.three && num === 3)), status);
      }

      round.isEligible = status;
      callback(round);
    })
  });
}
setInterval(exports.updatePhases, 1000 * 7);

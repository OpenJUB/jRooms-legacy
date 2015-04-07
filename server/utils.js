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
	if(!user || !user.points) {
		return callback("Points not defined", user);
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
				roommatePoints += config.collegeSpiritPoints * (users[i].college === users[i].nextCollege);

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
			user.save(function() {
				callback(null, user);
			});
		});

	} else {
		user.save(function() {
			callback(null, user);
		});
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
      round.isEligible = status;
      return callback(round);
    }
    Admin.findOne({}).exec(function(err2, settings) {
    	if(err2 || !settings) {
    		status = false;
    		round.isEligible = status;
      	return callback(round);
    	}
    	//console.log(round);
    	if(!round.filters) { // Malformed round. Return false. Exists because of the possibility for no active phase.
    		status = false;
    		round.isEligible = status;
      	return callback(round);
    	}

    	if(round.isCollegePhase && user.nextCollege) {
    		status = false;
    		round.isEligible = status;
    		return callback(round);
    	}

    	if(!round.isCollegePhase && user.nextRoom) {
    		status = false;
    		round.isEligible = status;
    		return callback(round);
    	}

      if(round.filters.enableFilterTall) {
        var tall = settings.tallPeople.split(',');
        status = Math.min((tall.indexOf(user.username) >= 0), status);
      }

      console.log(status);

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
        status = Math.min((user.points.total >= round.filters.pointsMin) , status);
      }

      if(round.filters.enableFilterRooms) {
        var num = user.roommates.length + 1;
        status = Math.min(((round.filters.rooms.one && num === 1) || (round.filters.rooms.two && num === 2) || (round.filters.rooms.three && num === 3)), status);
      }

      round.isEligible = status;
      console.log(status);
      return callback(round);
    });
  });
}

exports.phaseResult = function(phase, callback) {
	//console.log(phase);
  if(phase.isCollegePhase) {
    User.find({$where: 'this.nextCollege != null'}).exec(function(err, users) {
      //console.log(users);
      var results = {krupp: [], c3: [], nordmetall: [], mercator: []};
      if(err || !users) {
        console.log(err);
        return {};
      }
      //console.log(users);
      for(var i = 0; i < users.length; i++) {
        switch(users[i].nextCollege) {
          case 'Krupp':
            results.krupp.push({name: users[i].name});
            break;
          case 'Mercator':
            results.mercator.push({name: users[i].name});
            break;
          case 'Nordmetall':
            results.nordmetall.push({name: users[i].name});
            break;
          case 'C3':
            results.c3.push({name: users[i].name});
            break;
        }
      }
      //console.log(results);
      phase.results = results;
      return phase.save(function() {
        return callback(phase);
      });
    });
  } else {
    User.find({phaseId: phase.id}).exec(function(err, users) {
      var results = {krupp: [], c3: [], nordmetall: [], mercator: []};
      if(err || !users) {
      	//console.log("Scaramoosh");
        return results;
      }
      //console.log(users);

      for(var i = 0; i < users.length; i++) {
      	//console.log(users[i].username, users[i].nextRoom);
        switch(users[i].nextCollege) {
          case 'Krupp':
            results.krupp.push({name: users[i].name, room: users[i].nextRoom});
            break;
          case 'Mercator':
            results.mercator.push({name: users[i].name, room: users[i].nextRoom});
            break;
          case 'C3':
            results.c3.push({name: users[i].name, room: users[i].nextRoom});
            break;
          case 'Nordmetall':
            results.nordmetall.push({name: users[i].name, room: users[i].nextRoom});
            break;
        }
      }

      //console.log(results);

      phase.results = results;
      return phase.save(function() {
        return callback(phase);
      });
    });
  }
}

setInterval(exports.updatePhases, 1000 * 7);

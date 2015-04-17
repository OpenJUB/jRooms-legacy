'use strict';

var _ = require('lodash');
var User = require('./api/user/user.model');
var Phase = require('./api/phase/phase.model');
var Admin = require('./api/admin/admin.model');
var Room = require('./api/room/room.model');
var config = require('./config/environment');
var allRooms = require('./config/rooms/rooms');
var email = require('emailjs');
var request = require('request');


exports.AddUser = function(username, token, callback) {
  var url = config.openJUB.url + "user/name/" + username + "?token=" + token;
  request.cookie('openjub_session=' + token);

  request({
    method: 'GET',
    uri: url,
    params: {'openjub_session' : token},
    headers: {'Cookie' : 'openjub_session=' + token}
  }, function(err, response, body) {
    var res = JSON.parse(response.body);
    if(!res)
      return;

    exports.AddOpenJubUser(res, null, callback);
  });
}

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

		updated.save(function(err) {
			callback(err, updated);
		});
	});
}

exports.SetPhases = function(phases, callback) {
	console.log(phases);
	if(!phases)
		return callback();

	Phase.findOne({isCurrent: true}).exec(function(err, phase) {
		if(err) {
			return callback();
		}

		var id = -1;
		if(phase) {
			id = phase.id;
		}

		Phase.find({}).remove().exec();

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
				results: item.results
			});
      if(item.from && item.to) {
        tmp.from.setHours(2, 15);
        tmp.to.setHours(1, 51);
      }

			tmp.isCurrent = (item.from <= (new Date()) && item.to >= (new Date()));

			tmp.save();
		}

    callback();
	});
}

exports.updatePhases = function() {
  console.log("Tick");

	Admin.findOne({}).exec(function(err, settings) {
		if(err || !settings){
			console.log("PANIC");
			console.log(err);
			return;
		}

    //console.log("Not kidding");

		if(settings && settings.isDebug)
			return;

    //console.log("Not kidding");

		Phase.findOne({isCurrent: true}).exec(function(err, phase) {
			if(err) {
				return;
			}
			Phase.find({}).exec(function(err2, data) {
				if(err2 || !data) {
					console.log("ANOTHER PANIC");
					console.log(err);
          return;
				}

				var cur = false;
        var newActive = null;


        var done = function(phase, data, i) {
          if(i >= data.length - 1) {
            return;
          }

          savePhase(phase, data, i+1);
        }

        var saveData = function(phase, data, i) {
          data[i].isCurrent = (data[i].from <= (new Date()) && data[i].to >= (new Date()));
          if(phase && data[i].id !== phase.id && data[i].isCurrent) {
            newActive = data[i];

            phase.isCurrent = false;
            phase.save(function() {
              exports.generateResults(phase.id, true, function() {
                data[i].save(function() {
                  done(phase, data, i);
                });
              });
            });
          } else {
            console.log("Boop");
            data[i].save(function() {
              if(phase && data[i].id === phase.id && data[i].isCurrent === false) {
                exports.generateResults(phase.id, true, function() {
                  done(phase, data, i);
                });
              }
              else {
                exports.phaseResult(data[i], function(results) {
                  done(phase, data, i);
                });
              }
            });
          }

          return saveData(phase, data, 0);
        }
      });
		});
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

exports.isEligible = function(token, round, callback) {
  var status = true;
  if(!round) {
  	return callback(round);
  }
  User.findOne({token: token}).exec(function(err, user) {
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
      else if(round.isCollegePhase)
      {
        status = true;
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

      //console.log(status);

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
        status = Math.min(((round.filters.rooms.single && num === 1) || (round.filters.rooms.double && num === 2) || (round.filters.rooms.triple && num === 3)), status);
      } else {
      	status = Math.min(status, user.roommates.length === 1);
      }

      //console.log(round.filters);
      if(round.filters.enableWhitelist) {
        var whitelist = round.filters.whitelist.split(',');
        status = Math.min((whitelist.indexOf(user.username) >= 0), status);
      }

      round.isEligible = status;
      //console.log(status);
      return callback(round);
    });
  });
}

exports.phaseResult = function(phase, callback) {
	//console.log(phase);
  if(phase.isCollegePhase) {
    User.find({$where: 'this.nextCollege != null'}).exec(function(err, users) {
      //console.log(users);
      var results = {krupp: [], c3: [], nordmetall: [], mercator: [], unallocated: []};
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
      User.find({}, 'name nextCollege description').exec(function(err, u) {
        if(err || !u) {
          return;
        }

        var tmp = _.filter(u, function(item) {
          return (!item.nextCollege && item.description.substr(0, 2) === "ug");
        });

        //tmp = _.pluck(tmp, 'name');

        results.unallocated = tmp;

        //console.log(results);

        //console.log(results);
        phase.results = results;
        return phase.save(function() {
          //console.log(phase);
          return callback(phase);
        });
      });
    });
  } else {
    User.find({phaseId: phase.id}).exec(function(err, users) {
      var results = {krupp: [], c3: [], nordmetall: [], mercator: [], unallocated: []};
      if(err || !users) {
      	//console.log("Scaramoosh");
        return results;
      }
      //console.log(users);

      for(var i = 0; i < users.length; i++) {
        if(!users[i].nextRoom) {
          results.unallocated.push({name: users[i].name, room: users[i].nextRoom});
          continue;
        }
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

exports.populateRoomInfo = function() {
	Room.remove({}).exec();

  var all = [];

  for(var i = 0; i < allRooms.length; ++i) {
    for(var j = 0; j < allRooms[i].blocks.length; ++j) {
      for(var fl = 0; fl < allRooms[i].blocks[j].floors.length; ++fl) {
        for(var ro = 0; ro < allRooms[i].blocks[j].floors[fl].rooms.length; ++ro) {
          for(var room = 0; room < allRooms[i].blocks[j].floors[fl].rooms[ro].contains.length; ++room) {

            var result = {
              college : allRooms[i].name,
              block : allRooms[i].blocks[j].name,
              floor : allRooms[i].blocks[j].floors[fl].number,
              type : allRooms[i].blocks[j].floors[fl].rooms[ro].type,
              rooms : allRooms[i].blocks[j].floors[fl].rooms[ro].contains,
              name : allRooms[i].blocks[j].floors[fl].rooms[ro].contains[room],
              isAvailable : true,
              applicants : 0,
              isDisabled : false
            };

            all.push(result);
            //result.save();
          }
        }
      }
    }
  }

  var callback = function(all, i) {
    if(i >= all.length)
      return;

    saveFunction(all, i+1);
  }

  var saveFunction = function(all, i) {
    var tmp = new Room(all[i]);
    tmp.save(function() {
      callback(all, i);
    });
  }

  saveFunction(all, 0);
}

exports.generateResults = function(phaseId, save, callback) {
	console.log("Hey, this was called");
  Phase.findOne({id: phaseId}).exec(function(err, phase) {
    if(phase.isCollegePhase) {
      return calculateColleges(phase, callback);
    } else {
      return calculatePhase(phase, callback);
    }
  });
}

var calculatePhase = function(phase, callback) {
  //console.log("Here bruh");
  //console.log(phase);
  User.find({phaseId: phase.id}).exec(function(err, u) {
    if(err || !u) {
      callback(null);
    }

    var users = shuffle(u);

    var matrix = {};
    var rooms = [];
    var used = [];

    for(var i = 0; i < users.length; i++) {
      rooms = rooms.concat(users[i].rooms);
    }

    console.log(rooms);

    rooms = rooms.filter(exports.onlyUnique);

    console.log(rooms);

    for(var i = 0; i < users.length; i++) {
      if(used.indexOf(users[i].username) >= 0) {
        continue;
      }

      matrix[users[i].username] = calc(rooms, users[i], phase.filters.pointsMax);
      used.push(users[i]);
      for(var j = 0; j < users[i].roommates.length; j++) {
        used.push(users[i].roommates[j].username);
      }
    }

    console.log(matrix);

    var tmp_count = 0;
    while(_.size(matrix) < rooms.length) { // We need to make the matrix square
      matrix["BLANK" + tmp_count] = calc(rooms, {rooms: []}, phase.filters.pointsMax);
      ++tmp_count;
    }

    while(rooms.length < _.size(matrix)) {
      for(var prop in matrix) {
        matrix[prop].push(100000);
      }
      rooms.push("Unallocated this round");
    }
    console.log(matrix);

    /*matrix = {
      'fstankovsk' : [20, 25, 22, 28],
      'slal' :       [15, 18, 23, 17],
      'dcucleschi' : [19, 17, 21, 24],
      'abarbarosi' : [25, 23, 24, 24]
    };

    rooms = ["First", "Second", "Third", "Fourth"];
		// PROPER RESULT IS:
		// fstankovsk: First
		// slal: Fourth
		// dcucleschi: Second
		// abarbarosi: Third
    */

    return HungarianOne(matrix, rooms, function(data) {
      var users = [];
      for(var prop in data) {

        if(/^(\-|\+)?([0-9]+|Infinity)$/.test(prop))
          continue;
        users.push(prop);

      }
      console.log(data);

     var newCallback = function(data, nUsers, i) {

        if(!i && i !== 0) {
          return callback(null);
        }

        if(i >= nUsers.length - 1) {
          console.log("WooHoo");
          return exports.phaseResult(phase, callback);
        }
        else {
          return saveUser(data, nUsers, i + 1, newCallback);
        }
     };

     var saveUser = function(data, nUsers, i, callB) {

        if(i >= nUsers.length) {
          return callB(data, nUsers, []);
        }
        User.findOne({username: nUsers[i]}).exec(function(err, item) {
          if(err || !item) {

            if(nUsers[i].lastIndexOf("BLANK", 0) === 0) {
              return callB(data, nUsers, i);
            }

            return callB(data, nUsers, null);
          }

          console.log(data);
          //console.log(item.username);
          //console.log(data[item.username]);
          var newTemp = data[item.username].split(',');
          Room.findOne({name: newTemp[0]}).exec(function(err, room) {
            if(err) {
              return callB(data, nUsers, null);
            }

            console.log(room);

            if(!room) { // Unallocated this round
              return callB(data, nUsers, i);
            } else {
              item.nextRoom = room.rooms[0];
              item.save(function() {
                Room.findOne({name: room.rooms[0]}).exec(function(err, dbRoom) {
                  if(err || !dbRoom) {
                    return;
                  }

                  dbRoom.isAvailable = false;
                  dbRoom.assignedTo = item.name;
                  dbRoom.save();

                  //console.log(i);
                  var counter = 0;

                  var first = function(roomm, ct) {
                    if(ct >= roomm.length - 1)
                      return callB(data, nUsers, i);

                    return second(roomm, i+1);
                  }

                  var second = function(roomm, ct) {
                    console.log(roomm);
                    console.log(ct);
                    User.findOne({username: roomm[ct].username}).exec(function(err, use) {
                      ++counter;

                      if(err || !use) {
                        return first(roomm, ct);
                      }

                      use.nextRoom = room.rooms[counter];
                      use.save(function() {
                        Room.findOne({name: use.nextRoom}).exec(function(err, dbRoom2) {
                          if(dbRoom2) {
                            dbRoom2.isAvailable = false;
                            dbRoom2.assignedTo = use.name;
                            return dbRoom2.save(function() {
                              return first(roomm, ct);
                            })
                          }
                          return first(roomm, ct);
                        });
                      });

                    });
                  }
                  //console.log(item.roommates);
                  return second(item.roommates, 0);
                });
              });
            }
          });
        });
      };

      return saveUser(data, users, 0, newCallback);
    });
  });
}

var HungarianOne = function(matrix, rooms, callback) {
  for(var user in matrix) {
    var min = _.min(matrix[user]);
    for(var i = 0; i < matrix[user].length; ++i) {
      matrix[user][i] -= min;
    }
  }

  return HungarianTwo(matrix, rooms, callback);
}

var HungarianTwo = function(matrix, rooms, callback) {

  for(var i = 0; i < _.size(matrix); ++i) {
    var min = 100000;
    for(var prop in matrix) {
      min = Math.min(min, matrix[prop][i]);
    }

    for(var prop in matrix) {
      matrix[prop][i] -= min;
    }
  }

  return HungarianAssign(matrix, rooms, callback);
}

var HungarianAssign = function(matrix, rooms, callback) {
  //console.log(matrix);
  var assigned = {};
  var lastSize = 0;
  var matrixSize = _.size(matrix);
  //console.log(matrixSize);
  var broken = false;

  while(lastSize < 2 * matrixSize) {
    console.log(assigned);
    for(var user in matrix) {
      if(assigned[user])
        continue;

      var count = 0;
      var index = -1;

      for(var i = 0; i < matrixSize; ++i) {
        if(matrix[user][i] === 0 && !assigned.hasOwnProperty(i)) {
          //console.log("Found zero at " + user + " " + i);
          ++count;
          index = i;
        }
      }

      if(count === 1 && index !== -1) {
        assigned[index] = user;
        assigned[user] = rooms[index];
      }
    }

    for(var i = 0; i < matrixSize; ++i) {
      if(assigned.hasOwnProperty(i))
        continue;

      var count = 0;
      var username = "";

      for(var user in matrix) {
        if(matrix[user][i] === 0 && !assigned.hasOwnProperty(user)) {
          ++count;
          username = user;
        }
      }

      if(count === 1 && username !== "") {
        assigned[username] = rooms[i];
        assigned[i] = username;
      }
    }

    if(_.size(assigned) === lastSize) {
      var unassigned = null;
      for(var user in matrix) {// Check if all our users are allocated. If so, we're done. If not, we can't continue so we return an empty array.
        /*if(user.lastIndexOf("BLANK", 0) !== 0) {

          continue;
        }*/
        //console.log("I'm in your loop");
        console.log(user);
        if(!assigned.hasOwnProperty(user)) {

          var zeroes = [];
          for(var i = 0; i < matrixSize; ++i) {
            if(matrix[user][i] === 0 && !assigned.hasOwnProperty(i))
              zeroes.push(i);
          }
          console.log(zeroes);
          if(zeroes.length > 1) {
            var rand = Math.round(Math.random() * (zeroes.length - 1));
            console.log(rand);
            assigned[user] = rooms[zeroes[rand]];
            assigned[zeroes[rand]] = user;
            unassigned = user;
            break;
          }
        }
      }
      if(unassigned) {
        lastSize = _.size(assigned);
        continue;
      } else {
        broken = true;
        break;
      }
    }

    lastSize = _.size(assigned);
  }

  console.log(assigned);

  if(!broken) {
    return callback(assigned);
  }

  var markedRows = {};
  var markedColumns = {};

  for(var user in matrix) {
    if(!assigned.hasOwnProperty(user)) {
      markedRows[user] = true;
    }
  }

  var lastRows = _.size(markedRows);
  var lastCols = _.size(markedColumns);

  while(true) {
    for(var user in markedRows) {
      for(var i = 0; i < matrixSize; ++i) {
        if(matrix[user][i] === 0) {
          markedColumns[i] = true;
        }
      }
    }

    for(var col in markedColumns) {
      if(!assigned.hasOwnProperty(col))
        continue;
      markedRows[assigned[col]] = true;
    }

    if(lastRows === _.size(markedRows) && lastCols === _.size(markedColumns)) { // No assignment was made
      break;
    }

    lastRows = _.size(markedRows);
    lastCols = _.size(markedColumns);
  }

  // Lines go through UNMARKED rows and MARKED columns

  var minimum = 100000;

  for(var user in matrix) {
    for(var i = 0; i < matrixSize; ++i) { // Minimum from MARKED rows and UNMARKED columns
      if(markedRows.hasOwnProperty(user) && !markedColumns.hasOwnProperty(i)) {
        minimum = Math.min(minimum, matrix[user][i]);
      }
    }
  }

  for(var user in matrix) {
    for(var i = 0; i < matrixSize; ++i) { // Add to crossroads of lines, subtract from open points
      if(markedRows.hasOwnProperty(user) && !markedColumns.hasOwnProperty(i)) {
        matrix[user][i] -= minimum;
      } else if(!markedRows.hasOwnProperty(user) && markedColumns.hasOwnProperty(i)) {
        matrix[user][i] += minimum;
      }
    }
  }

  return HungarianAssign(matrix, rooms, callback);
}

var calc = function(rooms, user, cap) {
  var res = [];
  for(var i = 0; i < rooms.length; i++) {
    if(!user || !user.rooms) {
      return [];
    }

    var ind = user.rooms.indexOf(rooms[i]);
    res.push(ind < 0 ? 100000 : (20 - Math.min(user.points.totalPoints, cap)) * (ind + 1));
  }

  return res;
}

var shuffle = function (o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var calculateColleges = function(phase, callback) {
  User.find({$where: "this.college_preference.length > 0" }).exec(function(err, u) {
      if(err || !u) {
        return;
      }

      var users = _.shuffle(u);
      console.log(users);

      var c3 = [];
      var krupp = [];
      var nordmetall = [];
      var mercator = [];

      for(var i = 0; i < users.length; i++) {
        var tmp = users[i];

        switch(users[i].college_preference[0]) {
          case 'C3':
            c3.push(users[i]);
            break;
          case 'Nordmetall':
            nordmetall.push(users[i]);
            break;
          case 'Mercator':
            mercator.push(users[i]);
            break;
          case 'Krupp':
            krupp.push(users[i]);
            break;
          default:
            break;
        }
      }

      var percentages = [];

      percentages.push({
        people: c3,
        college: 'C3',
        fill: collegeFill(c3.length, 'C3')
      });

      percentages.push({
        people: mercator,
        college: 'Mercator',
        fill: collegeFill(mercator.length, 'Mercator')
      });

      percentages.push({
        people: krupp,
        college: 'Krupp',
        fill: collegeFill(krupp.length, 'Krupp')
      });

      percentages.push({
        people: nordmetall,
        college: 'Nordmetall',
        fill: collegeFill(nordmetall.length, 'Nordmetall')
      });

      percentages.sort(function(a, b) {
        return a.fill - b.fill;
      });

      //console.log(percentages);
      var counter = 0;

      while(percentages[0].fill < config.collegeFillMinimum || percentages[3].fill > config.collegeFillMaximum) {
        var total = 0;
        for(var i = 0; i < percentages.length; ++i) {
          total += percentages[i].people.length;
        }

        var totalCollege = config.collegeCapacity.c3 + config.collegeCapacity.krupp + config.collegeCapacity.nordmetall + config.collegeCapacity.mercator;

        if(total < config.collegeFillMinimum * totalCollege) {
          break;
        }
        var second_choice = [];
        for(var i = 0; i < percentages[3].people; ++i) {
          if(percentages[3].people[i].college_preference[1] === percentages[0].name && percentages[3].people[i].college !== percentages[3].people[i].college_preference[0] && percentages[3].people[i].year === (new Date()).getFullYear() - 2000 + 2) {
            second_choice.push(i);
          }
        }

        if(second_choice.length === 0) {
          for(var i = 0; i < percentages[3].people; ++i) {
             if(percentages[3].people[i].college_preference[2] === percentages[0].name && percentages[3].people[i].college !== percentages[3].people[i].college_preference[0] && percentages[3].people[i].year === (new Date()).getFullYear() - 2000 + 2) {
              second_choice.push(i);
            }
          }
        }

        var ind = Math.round(Math.random() * (second_choice.length - 1));
        var tmp = percentages[3].people[second_choice[ind]];

        percentages[3].people.splice(ind, 1);
        percentages[0].people.push(tmp);

        percentages[3].fill = collegeFill(percentages[3].people.length, percentages[3].college);
        percentages[0].fill = collegeFill(percentages[0].people.length, percentages[0].college);

        percentages.sort(function(a, b) {
          return a.fill - b.fill;
        });

        counter++;
        if(1000 == counter) {
          break;
        }
      }
      console.log(percentages);
      for(var i = 0; i < percentages.length; i++) {
        for(var j = 0; j < percentages[i].people.length; j++) {
            percentages[i].people[j].nextCollege = percentages[i].college;
            percentages[i].people[j].points.collegeSpiritPoints = config.collegeSpiritPoints * (percentages[i].people[j].nextCollege === percentages[i].people[j].college);
            percentages[i].people[j].save();
        }
      }

      return exports.phaseResult(phase, callback);

  });
}

var collegeFill = function(number, name) {
  switch(name) {
    case 'C3':
      return 100.0 * number / config.collegeCapacity.c3;
      break;
    case 'Mercator':
      return 100.0 * number / config.collegeCapacity.mercator;
      break;
    case 'Nordmetall':
      return 100.0 * number / config.collegeCapacity.nordmetall;
      break;
    case 'Krupp':
      return 100.0 * number / config.collegeCapacity.krupp;
      break;
  }
}

/*var sendEmails = function() {

	var server  = email.server.connect({
	   user:    config.email.user,
	   password: config.email.pass,
	   host:    config.email.host,
	   port: 		config.email.port,
	   tls: {ciphers: "SSLv3"}
	});

	var message = {
	   text:    "i hope this works",
	   from:    "Housing Allocation <" + config.email.address + ">",
	   to:      "someone <fi.stankovski@gmail.com>",
//	   cc:      "else <else@your-email.com>",
	   subject: "[[HOUSING]]: Welcome to our housing system",
	   attachment:
	   [
	      {data:"<html>i <i>hope</i> this works!</html>", alternative:true},
	      // {path:"path/to/file.zip", type:"application/zip", name:"renamed.zip"}
	   ]
	};
	server.send(message, function(err, message) { console.log(err || message); });
}*/

setInterval(exports.updatePhases, 1000 * 7);
//setInterval(sendEmails, 1000 * 10);

// REMINDER EMAIL
// RESULTS EMAIL

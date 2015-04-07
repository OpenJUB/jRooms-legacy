'use strict';

var _ = require('lodash');
var config = require('../../config/environment');
var User = require('./../user/user.model');
var Admin = require('./../admin/admin.model');
var Phase = require('./../phase/phase.model');
var Room = require('./../room/room.model');
var request = require('request');
var utils = require('../../utils');

// Get settings from the database.. Or not?
var settings; 
Admin.findOne({}).exec(function(err, data) {
  if (!err && data) {
    settings = data;
  }
  else {
   settings = new Admin({
      isDatabaseReady : false,
      isDebug : false,
      tallPeople: '',
      disabledRooms: '',
      disabledUsers: '',
      maxRooms: 7,
      email: {
        preference1: false,
        preference2: false,
        preference3: false,
        preference4: false
      }
    });

    settings.save();
  }
});

exports.currentSettings = function(req, res) {
  if (settings) {
    Phase.find({}).exec(function(err, data) {
      if(err) {
        return res.json(500, err);
      }
      var tmp = data;
      tmp.sort(function(a, b) {
          return a.id - b.id;
        });

      var clean_settings = {
        isDatabaseReady: settings.isDatabaseReady, 
        tallPeople: settings.tallPeople, 
        disabledRooms: settings.disabledRooms, 
        disabledUsers: settings.disabledUsers, 
        maxRooms: settings.maxRooms, 
        email: settings.email, 
        phases: tmp,
        isDebug: settings.isDebug
      };

      return res.json(200, clean_settings);
    });
  } else {
    return res.json(500, "No settings found!");
  }
}

exports.updateSettings = function(req, res) {
  if (req.body.settings) {
    Admin.find({}).remove().exec();

    settings = new Admin(req.body.settings);
    settings.save();

    utils.SetPhases(req.body.settings.phases, function() {
      return res.json(200, { status : 'success' });
    });
  } else {
      return res.json(500, "Error updating settings");
  }
}

/**
 * @brief Get user
 * @details Gets user details by CampusNet username
 * 
 * @param req request
 * @param res response
 * 
 * @return 200 if success, 500 otherwise
 */
exports.getUser = function(req, res) {
  if (!req.query.username) {
    return res.json(500, 'Username field is not set');
  }

  User.findOne({ username : req.query.username }, function(err, data) {
    if (err) {
      return res.json(500, err);
    }

    if (data.token) delete data.token;
    if (data.__v) delete data.__v;
    if (data._id) delete data._id;

    return res.json(200, data);
  });
}

/**
 * @brief Set user
 * @details Modifies user's information by CampusNet username
 * 
 * @param req request
 * @param res result
 * 
 * @return 200 if success, 500 otherwise
 */
exports.setUser = function(req, res) {
  if (!req.body.username && req.body.user) {
    return res.json(500, 'Username or user field is not set');
  }

  User.update({ username : req.body.username }, req.body.user, function(err, data) {
      if (err) {
        return res.json(500, err);
      }

      return res.json(200, {});
  });
}

exports.resetSystem = function(req, res) {
  User.find({}).remove().exec();
  Admin.find({}).remove().exec();

   settings = new Admin({
    isDatabaseReady : false,
    isDebug : false,
    tallPeople: '',
    disabledRooms: '',
    disabledUsers: '',
    maxRooms: 7,
    email: {
      preference1: false,
      preference2: false,
      preference3: false,
      preference4: false
    },
    phases: []
  });

  settings.save();

  return res.json(200, settings);
}


exports.importUsers = function(req, res) {
  settings.isDatabaseReady = true;
  settings.save();

  User.find({}).remove().exec();

  var url = config.openJUB.url + "query/?limit=10000";
  var token = req.cookies.token;
  request.cookie('openjub_session=' + token);

  request({
    method: 'GET',
    uri: url,
    params: {'openjub_session' : token},
    headers: {'Cookie' : 'openjub_session=' + token}
  }, function(err, response, body) {
    if(err) {
      return res.json(500, err);
    }
    else {
      res.json(200, { status: 'success' });
    }

    var users = JSON.parse(response.body).data;

    users.forEach(function(item) {
      utils.AddOpenJubUser(item, null, function() {});
    });
  });
}


exports.forcePhase = function(req, res) {
  var phaseId = req.body.id;
  console.log(phaseId);

  Phase.find({}).exec(function(err, data) {
    if(err || !data) {
      return res.json(500, err);
    }
//    utils.round_force = phaseId;
    data.forEach(function(item) {
      var status = (item.id === phaseId);
      if(item.isCurrent && !status) {
        generateResults(item.id, true, function() {
          item.isCurrent = status;
          item.save();
        });
      } else {
        item.isCurrent = status;
        item.save();
      }
    });

    return res.json(200, {status: "Success", isDebug: true});
  });
}

exports.cancelForce = function(req, res) {

  utils.updatePhases();

  return res.json(200, {status: "Success", isDebug: false});
}

var generateResults = function(phaseId, save, callback) {
  Phase.findOne({id: phaseId}).exec(function(err, phase) {
    if(phase.isCollegePhase) {
      return calculateColleges(phase, save, callback);
    } else {
      return calculatePhase(phase, save, callback);
    }
  });
}

var calculatePhase = function(phase, save, callback) {
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

    rooms = rooms.filter(utils.onlyUnique, users[i]);

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
      'slal' : [15, 18, 23, 17],
      'dcucleschi' : [19, 17, 21, 24],
      'abarbarosi' : [25, 23, 24, 24]
    };

    rooms = ["First", "Second", "Third", "Fourth"];*/
    
    return HungarianOne(matrix, rooms, function(data) {
      if(save) {
        var users = [];
        for(var prop in data) {

          if(/^(\-|\+)?([0-9]+|Infinity)$/.test(prop)) 
            continue;
          users.push(prop);
        }
        //console.log(users);
        //console.log(data);
       
       var newCallback = function(data, nUsers, i) {
          //console.log("You're here. Welcome");
          if(!i && i !== 0) {
            //console.log("You're here. Welcome");
            return callback(null);
          }
          //console.log(nUsers);
          if(i >= nUsers.length - 1) {
            console.log("WooHoo");
            return utils.phaseResult(phase, callback);
          } else {
            //console.log("Blink");
            return saveUser(data, nUsers, i + 1, newCallback);
          }
       };

       var saveUser = function(data, nUsers, i, callB) {
          //console.log(i);
          if(i >= nUsers.length) {
            return callB(data, nUsers, []);
          }
          User.findOne({username: nUsers[i]}).exec(function(err, item) {
            if(err || !item) {
              //console.log("Error, Error");
              if(nUsers[i].lastIndexOf("BLANK", 0) === 0) {
                return callB(data, nUsers, i);
              }

              return callB(data, nUsers, null);
            }

            console.log(data);
            //console.log(item.username);
            //console.log(data[item.username]);
            Room.findOne({name: data[item.username]}).exec(function(err, room) {
              if(err) {
                return callB(data, nUsers, null);
              }

              console.log(room);

              if(!room) { // Unallocated this round
                item.phaseId = null;
                item.save();

                item.roommates.forEach(function(tmp) {
                  User.update({username: {$in:item.roommates}}, {phaseId: null}).exec();
                });
              } else {
                item.nextRoom = room.rooms[0];
                item.save(function() {
                  //console.log(i);
                  var counter = 1;
                  item.roommates.forEach(function(tmp) {
                    User.findOne({username: tmp.username}).exec(function(err, use) {
                      use.nextRoom = room.rooms[counter];
                      ++counter;
                      use.save();
                    });
                  });
                });
              }

              return callB(data, nUsers, i);
            });
          });
        };

        return saveUser(data, users, 0, newCallback);
      } else {
        return callback(data);
      }
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
          console.log("Found zero at " + user + " " + i);
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
        console.log("I'm in your loop");
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

var calculateColleges = function(phase, save, callback) {
  User.find({$where: "this.college_preference.length > 0" }).exec(function(err, u) {
      if(err || !u) {
        return res.json(500, err);
      }

      var users = shuffle(u);

      var c3 = [];
      var krupp = [];
      var nordmetall = [];
      var mercator = [];

      for(var i = 0; i < users.length; i++) {
        var tmp = users[i];
        switch(users[i].college_preference[0]) {
          case 'C3':
            c3.push(tmp);
            break;
          case 'Nordmetall':
            nordmetall.push(tmp);
            break;
          case 'Mercator':
            mercator.push(tmp);
            break;
          case 'Krupp':
            krupp.push(tmp);
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

      while(percentages[0].fill < config.collegeFillMinimum) {
        var second_choice = [];
        for(var i = 0; i < percentages[3].people; ++i) {
          if(percentages[3].college_preference[1] === percentages[0].name) {
            second_choice.push(i);
          }
        }

        if(second_choice.length === 0) {
          for(var i = 0; i < percentages[3].people; ++i) {
            if(percentages[3].college_preference[2] === percentages[0].name) {
              second_choice.push(i);
            }
          }
        }

        var ind = Math.random() * (second_choice.length - 1);
        var tmp = percentages[3].people[second_choice[ind]];

        percentages[3].people.splice(ind, 1);
        percentages[0].push(tmp);

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
      if(save) {
        //console.log("SAAVE");
        for(var i = 0; i < percentages.length; i++) {
          for(var j = 0; j < percentages[i].people.length; j++) {
              percentages[i].people[j].nextCollege = percentages[i].college;
              percentages[i].people[j].points.collegeSpiritPoints = config.collegeSpiritPoints * (percentages[i].people[j].nextCollege === percentages[i].people[j].college);
              percentages[i].people[j].save();
          }
        }

        return utils.phaseResult(phase, callback);
      } else {
        return callback();
      }
  });
}

var collegeFill = function(number, name) {
  switch(name) {
    case 'C3':
      return 100.0 * number /config.collegeCapacity.c3;
      break;
    case 'Mercator':
      return 100.0 * number /config.collegeCapacity.mercator;
      break;
    case 'Nordmetall':
      return 100.0 * number /config.collegeCapacity.nordmetall;
      break;
    case 'Krupp':
      return 100.0 * number /config.collegeCapacity.krupp;
      break;
  }
}
'use strict';

var _ = require('lodash');
var config = require('../../config/environment');
var User = require('./../user/user.model');
var Admin = require('./../admin/admin.model');
var Phase = require('./../phase/phase.model');
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
          return a.id - b.id});
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
  }

  utils.SetPhases(req.body.settings.phases, function() {
    return res.json(200, { status : 'success' });
  });

  return res.json(500, "Error updating settings");
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

  var url = "https://api.jacobs-cs.club/query/?limit=10000";
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

    users.forEach(function(item){
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
      calculateColleges(phase, save, callback);
    } else {
      calculatePhase(phase, save, callback);
    }
  });
}

var calculatePhase = function(phase, save, callback) {
  console.log("Here bruh");
  User.find({phaseId: phase.id}).exec(function(err, users) {
    var matrix = [];
    var rooms = [];
    for(var i = 0; i < users.length; i++) {
      rooms = rooms.concat(users.rooms);
    }

    rooms = rooms.filter(utils.onlyUnique, users[i]);

    for(var i = 0; i < users.length; i++) {
      if(matrix[users[i].username]) {
        continue;
      }
      console.log("AAAAA");

      matrix[users[i]] = calc(rooms, users[i]);
      for(var j = 0; j < users[i].roommates.length; j++) {
        matrix[users[i].roommates[j].username] = matrix[users[i].username];
      }
    }

    console.log(matrix);
  });
}

var calc = function(rooms, user) {
  var res = [];
  for(var i = 0; i < rooms.length; i++) {
    var ind = user.rooms.indexOf(rooms[i]);
    res.push(ind < 0 ? 100000 : (20 - user.points.totalPoints) * (ind + 1));
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

      console.log(percentages);
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
        console.log("SAAVE");
        for(var i = 0; i < percentages.length; i++) {
          for(var j = 0; j < percentages[i].people.length; j++) {
              percentages[i].people[j].nextCollege = percentages[i].college;
              percentages[i].people[j].save();
          }
        }

        phaseResult(phase, callback);
      } else {
        callback();
      }
  });
}

var phaseResult = function(item, callback) {

  if(item.isCollegePhase) {
    User.find({$where: 'this.nextCollege != null'}).exec(function(err, users) {
      console.log(users);
      var results = {krupp: [], c3: [], nordmetall: [], mercator: []};
      if(err || !users) {
        console.log(err);
        return {};
      }
      console.log(users);
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
      console.log(results);
      item.results = results;
      item.save(function() {
        callback(item);
      });
    });
  } else {
    User.find({phase: item.id}).exec(function(err, users) {
      var results = {krupp: [], c3: [], nordmetall: [], mercator: []};
      if(err || !users) {
        return {};
      }
      for(var i = 0; i < users.length; i++) {
        switch(users[i].nextCollege) {
          case 'Krupp':
            results.krupp.push({name: users[i].name, room: users[i].room});
            break;
          case 'Mercator':
            results.mercator.push({name: users[i].name, room: users[i].room});
            break;
          case 'C3':
            results.c3.push({name: users[i].name, room: users[i].room});
            break;
          case 'Nordmetall':
            results.nordmetall.push({name: users[i].name, room: users[i].room});
            break;
        }
      }

      return {
        id: item.id,
        name: item.name, 
        results: results
      };
    });
  }
  
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
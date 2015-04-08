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
  Phase.find({}).remove().exec();
  Room.find({}).remove().exec();

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
        utils.generateResults(item.id, true, function() {
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

exports.endAllocation = function(req, res) {
  Phase.findOne({isCurrent: true}).exec(function(err, phase) {
    if(err) {
      return res.json(500, err);
    }

    if(!phase) {
      return res.json(200, {});
    }
    utils.generateResults(phase.id, true, function() {
      return res.json(200, {});
    });
  });
}
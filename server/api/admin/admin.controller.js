'use strict';

var _ = require('lodash');
var config = require('../../config/environment');
var User = require('./../user/user.model');
var controller = require('./../user/user.controller');
var request = require('request');

var settings = {
      isDatabaseReady : false,
      tallPeople: '',
      disabledRooms: '',
      email: {
        preference1: false,
        preference2: false,
        preference3: false,
        preference4: false
      },
      phases: []
    };

exports.importUsers = function(req, res) {
  // First user will execute this to pull the others.
  // Please, modify from the stuff below.
  settings.isDatabaseReady = true;
  res.json(200, settings);
}

exports.currentSettings = function(req, res) {
    res.json(200, settings);
}

exports.updateSettings = function(req, res) {
  if (req.body.settings) {
    settings = req.body.settings;
  }

  res.json(200, {});
}

exports.delete_users = function(req, res) {
  var token = req.cookies.token;
  User.$where({}).remove().exec();
  //database_is_empty = true;
}

exports.reset_users = function(req, res) {

  //console.log(req);
  //exports.delete_users(req, res);
  User.$where({}).remove().exec();
  var url = "https://api.jacobs-cs.club/query/?limit=10000";
  var token = req.cookies.token;
  request.cookie('openjub_session=' + token);
  //console.log(token);
  request({
    method: 'GET',
    uri: url,
    params: {'openjub_session' : token},
    headers: {'Cookie' : 'openjub_session=' + token}
  }, function(err, response, body) {
    //console.log("HERE");
    if(err) {
      res.status(500).send(err);
      return;
    }
    else {
      //console.log("AAAAAAAAA");
      //console.log(response);
      res
      .status(200)
      .send();
    }
    var users = JSON.parse(response.body).data;
    var fin = [];
    users.forEach(function(item){
      //var item = users[i];
      var this_year = new Date().getFullYear();
      if(item.status !== "undergrad" || item.year < (this_year - 2000)) {
        if(config.admins.indexOf(item.username) > -1)
        {

        }
        else
        {
          return;
        }
      }
      console.log(item.major);
      fin.push(item);
      var thing = new User({
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
        points: {}
      });
      thing.points = JSON.stringify(controller.calculate(thing));
      //console.log(user.points);

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
        points: thing.points
      });
      user.save();
      //console.log(user);
    });
  });
  //database_is_empty = false;
}
'use strict';

var _ = require('lodash');
var config = require('../../config/environment');
var User = require('./../user/user.model');
var controller = require('./../user/user.controller');
var request = require('request');


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
/*// Get list of admins
exports.index = function(req, res) {
  Admin.find(function (err, admins) {
    if(err) { return handleError(res, err); }
    return res.json(200, admins);
  });
};

// Get a single admin
exports.show = function(req, res) {
  Admin.findById(req.params.id, function (err, admin) {
    if(err) { return handleError(res, err); }
    if(!admin) { return res.send(404); }
    return res.json(admin);
  });
};

// Creates a new admin in the DB.
exports.create = function(req, res) {
  Admin.create(req.body, function(err, admin) {
    if(err) { return handleError(res, err); }
    return res.json(201, admin);
  });
};

// Updates an existing admin in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Admin.findById(req.params.id, function (err, admin) {
    if (err) { return handleError(res, err); }
    if(!admin) { return res.send(404); }
    var updated = _.merge(admin, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, admin);
    });
  });
};

// Deletes a admin from the DB.
exports.destroy = function(req, res) {
  Admin.findById(req.params.id, function (err, admin) {
    if(err) { return handleError(res, err); }
    if(!admin) { return res.send(404); }
    admin.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}*/
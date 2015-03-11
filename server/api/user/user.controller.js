'use strict';

var _ = require('lodash');
var User = require('./user.model');

exports.me = function(req, res) {
  // Filip, please use this kind of naming.
  return res.json(200, {
    name: 'Dmitrii Cucleschin',
    username: 'dcucleschi',
    college: 'Krupp',
    country: 'Moldova',
    description: 'ug 15 CS',
    major: 'Computer Science',
    roommates: ['johndoe'],
    inbox: ['herpderp'],
    isAdmin: true,
    college_preferences: []
  });
}

exports.requestRoommate = function(req, res) {
  return res.json(200, {
    name: 'Dmitrii Cucleschin',
    username: 'dcucleschi',
    college: 'Krupp',
    country: 'Moldova',
    description: 'ug 15 CS',
    major: 'Computer Science',
    roommates: ['johndoe'],
    inbox: ['herpderp'],
    isAdmin: true,
    college_preferences: []
  });
}

exports.acceptRoommate = function(req, res) {
  return res.json(200, {
    name: 'Dmitrii Cucleschin',
    username: 'dcucleschi',
    college: 'Krupp',
    country: 'Moldova',
    description: 'ug 15 CS',
    major: 'Computer Science',
    roommates: ['johndoe'],
    inbox: ['herpderp'],
    isAdmin: true,
    college_preferences: []
  });
}

exports.denyRoommate = function(req, res) {
  return res.json(200, {
    name: 'Dmitrii Cucleschin',
    username: 'dcucleschi',
    college: 'Krupp',
    country: 'Moldova',
    description: 'ug 15 CS',
    major: 'Computer Science',
    roommates: ['johndoe'],
    inbox: ['herpderp'],
    isAdmin: true,
    college_preferences: []
  });
}

exports.updateColleges = function(req, res) {
    return res.json(200, { status : "Great success! "});
}

exports.updateRooms = function(req, res) {
    return res.json(200, { status : "Great success! "});
}

// Example of nice style:
// exports.index = function(req, res) {
//   User.find(function (err, users) {
//     if(err) { return handleError(res, err); }
//     return res.json(200, users);
//   });
// };

function handleError(res, err) {
  return res.send(500, err);
}
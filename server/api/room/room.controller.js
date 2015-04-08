'use strict';

var _ = require('lodash');
var Room = require('./room.model');

exports.getRoom = function(req, res) {
  var roomName = req.query.roomName;
  Room.findOne({name: roomName}).exec(function(err, room) {
    if(err) {
      return res.json(500, err);
    }

    return res.json(200, room);
  })
}
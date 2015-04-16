'use strict';

var _ = require('lodash');
var Room = require('./room.model');
var map = require('../../config/rooms/rooms.js');

exports.getRoom = function(req, res) {
    var roomName = req.query.room;
    Room.findOne({
        name: roomName
    }).exec(function(err, room) {
        if (err) {
            return res.json(500, err);
        }

        return res.json(200, room);
    })
}

exports.getCollegeMap = function(req, res) {
    var college = req.query.college;
    var retMap = map[0];

    if (college == "Krupp")
        return res.json(200, retMap);

    if (college == "Mercator") {
        retMap = map[3];
        return res.json(200, retMap);
    }

    if (college == "C3") {
        retMap = map[2];
        return res.json(200, retMap);
    }

    if (college == "Nordmetall") {
        retMap = map[1];
        return res.json(200, retMap);
    }

    return res.json(500, "Bad");
}

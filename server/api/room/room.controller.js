'use strict';

var _ = require('lodash');
var Room = require('./room.model');

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
    

    Room.find({college: college}).exec(function(err, data) {
        if(err || !data) {
            return res.json(500, err);
        }

        return res.json(200, data);
    });
}

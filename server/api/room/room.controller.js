'use strict';

var _ = require('lodash');
var Room = require('./room.model');
var Admin = require('./../admin/admin.model');

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

        Admin.findOne({}).exec(function(err, settings) {
            if(err) {
              return res.json(500, err);
            }

            if(!settings) {
              settings = {};
              settings.disabledRooms = [];
            }

            for(var i = 0; i < data.length; ++i) {
              data[i].isDisabled = settings.disabledRooms.indexOf(data[i].name) >= 0;
            }

            return res.json(200, data);
        });
    });
}

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

            Phase.findOne({isCurrent: true}).exec(function(err, phase) {
              if(phase.filters) {

                for(var i = 0; i < data.length; ++i) {
                  if(phase.filters.enableFilterTall) {
                    data[i].isDisabled = Math.min(data[i].isDisabled, (tmp != "08" && tmp != "09" && tmp != "36" && tmp != "37"));
                  }

                  if(phase.filters.enableFilterQuiet) {
                    data[i].isDisabled = Math.min(data[i].isDisabled, !((item.college === 'C3' && item.block === 'D') || (item.college === 'Krupp' && item.block === 'A')));
                  }

                  if(phase.filters.enableFilterRooms) {
                    data[i].isDisabled = Math.min(data[i].isDisabled,
                      !((phase.filters.rooms.single && item.type === 'single') && (phase.filters.rooms.double && item.type === 'double') && (phase.filters.rooms.triple && item.type === 'triple'))
                    );
                  }
                }
              }
              return res.json(200, data);
            });
        });
    });
}

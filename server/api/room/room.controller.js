'use strict';

var _ = require('lodash');
var Room = require('./room.model');
var Admin = require('./../admin/admin.model');
var Phase = require('./../phase/phase.model');

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
              if(err) {
                return res.json(500, err);
              }

              //console.log(phase);
              if(phase && phase.filters) {

                for(var i = 0; i < data.length; ++i) {
                  if(phase.filters.enableFilterTall) {
                    var tmp = data[i].name.substring(4, 2);
                    data[i].isDisabled = Math.max(data[i].isDisabled, (tmp != "08" && tmp != "09" && tmp != "36" && tmp != "37"));
                  }

                  if(phase.filters.enableFilterQuiet) {
                    data[i].isDisabled = Math.max(data[i].isDisabled, !((data[i].college === 'C3' && data[i].block === 'D') || (data[i].college === 'Krupp' && data[i].block === 'A')));
                  }

                  if(phase.filters.enableFilterRooms) {
                    //console.log(data[i].type, phase.filters.rooms.single, phase.filters.rooms.double);
                    if(phase.filters.rooms.single && data[i].type !== 'single') {
                      data[i].isDisabled = true;
                    }

                    if(phase.filters.rooms.double && data[i].type !== 'double') {
                      data[i].isDisabled = true;
                    }

                    if(phase.filters.rooms.triple && data[i].type !== 'triple') {
                      data[i].isDisabled = true;
                    }
                  }
                }
              }
              return res.json(200, data);
            });
        });
    });
}

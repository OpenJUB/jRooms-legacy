'use strict';

var _ = require('lodash');
var Phase = require('./phase.model');
var User = require('./../user/user.model');
var Admin = require('./../admin/admin.model');

var isEligible = function(item, round, callback) {
  var status = true;
  User.findOne({token: item}).exec(function(err, user) {
    if(err || !user) {
      status = false;
    }
    Admin.findOne({}).exec(function(err2, settings) {
      if(round.filters.enableFilterTall) {
        status = (settings.tallPeople.indexOf(user.username) >= 0);
      }

      if(round.filters.enableFilterColleges) {
        var tmp = [];
        if(round.filters.colleges.krupp) {
          tmp.append("Krupp");
        }
        if(round.filters.colleges.mercator) {
          tmp.append("Mercator");
        }
        if(round.filters.colleges.c3) {
          tmp.append("C3");
        }
        if(round.filters.colleges.nordmetall) {
          tmp.append("Nordmetall");
        }

        status = (tmp.indexOf(user.nextCollege) >= 0);
      }

      if(round.filters.enableFilterExchange) {
        status = user.isExchange;
      } else {
        status = !user.isExchange;
      }

      if(round.filters.enableFilterPoints) {
        status = (user.points.total >= round.filters.pointsMin && user.points.total <= round.filters.pointsMax) 
      }

      if(round.filters.enableFilterRooms) {
        var num = user.roommates.length + 1;
        status = ((round.filters.rooms.one && num === 1) || (round.filters.rooms.two && num === 2) || (round.filters.rooms.three && num === 3));
      }

      round.isEligible = status;
      callback(round);
    })
  });
}

exports.currentPhase = function(req, res) {

  Phase.findOne({isCurrent: true}).exec(function(err, data) {
    if(err) {
      return res.json(500, err);
    }

    if(!data) {
      return res.json(200, {next: 'your earliest convenience to check again'});
    }

    data.isEligible = isEligible(req.cookies.token, data, function(new_data) {
      res.json(200, new_data);
    });
  });

  /*return res.json(200, {
    id: 1,
    name: 'Testphase',
    from: '11.11.2011',
    to: '12.11.2011',
    isCollegePhase: false,
    isEligible: isEligible(),
    maxRooms: 7,
    next: '13.11.2011', //'none' if done with phases
    filters: {
      // enableFilterTall: false,
      // enableFilterColleges: false,
      // enableFilterExchange: false,
      // enableFilterPoints: false,
      // enableFilterRooms: false,

      // pointsMin: '',
      // pointsMax: '',

      // colleges: {
      //   krupp: false,
      //   mercator: false,
      //   nordmetall: false,
      //   c3: false
      // },

      // rooms: {
      //   one: false,
      //   two: false,
      //   three: false
      // }
    }
  });*/
}

exports.result = function(req, res) {
  var phaseId = req.query.phaseId;

  return res.json(200, {
    phaseId: phaseId,
    results: [
      'bla',
      'herp',
      'derp'
    ]
  });
}

exports.allResults = function(req, res) {
  return res.json(200, [
  {
    phaseId: 1,
    results: [
      'bla',
      'herp',
      'derp'
    ]
  },
  {
    phaseId: 2,
    results: [
      'john',
      'doe',
      'derb'
    ]
  }]);
}
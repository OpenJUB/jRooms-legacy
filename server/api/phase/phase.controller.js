'use strict';

var _ = require('lodash');
var config = require('./../../config/environment');
var Phase = require('./phase.model');
var User = require('./../user/user.model');
var Admin = require('./../admin/admin.model');
var utils = require('./../../utils');

exports.currentPhase = function(req, res) {

  Phase.findOne({isCurrent: true}).exec(function(err, data) {
    if(err) {
      return res.json(500, err);
    }

    if(!data) {
      return res.json(200, {next: 'your earliest convenience to check again'});
    }

    data.isEligible = utils.isEligible(req.cookies.token, data, function(new_data) {
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
  var phaseId = req.body.phaseId;

  Phase.find({id: phaseId}).exec(function(err, data) {
    if(err || !data) {
      res.json(500, err);
    }

    return res.json(200, phaseResult(data));
  });
  /*return res.json(200, {
    phaseId: phaseId,
    name: 'A',
    results: [
      'bla',
      'herp',
      'derp'
    ]
  });*/
}

exports.allResults = function(req, res) {

  Phase.find({}).exec(function(err, data) {
    if(err || !data) {
      return res.json(500, err);
    }

    return res.json(200, data.sort(function(a, b) {
      return a.id - b.id;
    }));
  });
}


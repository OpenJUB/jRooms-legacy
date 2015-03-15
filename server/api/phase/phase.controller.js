'use strict';

var _ = require('lodash');
var Phase = require('./phase.model');

exports.currentPhase = function(req, res) {
  return res.json(200, {
    id: 1,
    name: 'Testphase',
    from: '11.11.2011',
    to: '12.11.2011',
    isCollegePhase: true,
    isEligible: true,
    maxRooms: 7, // will consider only if need a room alloc phase
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
  });
}

exports.result = function(req, res) {
  var phaseId = req.body.phaseId; // ?

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
'use strict';

var _ = require('lodash');
var json2csv = require('nice-json2csv');
var config = require('./../../config/environment');
var Phase = require('./phase.model');
var User = require('./../user/user.model');
var Admin = require('./../admin/admin.model');
var utils = require('./../../utils');

exports.currentPhase = function(req, res) {

  Phase.findOne({isCurrent: true}).exec(function(err, data) {
    if(err || !data) {
      return res.json(500, err);
    }

    //console.log("AAAA");

    utils.isEligible(req.cookies.token, data, function(new_data) {
      if(new_data.isEligible) {
        return res.json(200, new_data);
      }

      var finished = false;
      //console.log(new_data);
      var count = 0;
      Phase.find({}).exec(function(err, phases) {
        var check = function(phases, i, callback) {
          //console.log(i);
          utils.isEligible(req.cookies.token, phases[i], function(ph) {
            if(ph.isEligible && ph.to >= (new Date())) {
              return callback(phases, i, ph.from);
            }

            return callback(phases, i, null);
          });
        }
        var callback = function(phases, i, n) {
          if(n) {
            new_data.next = n;
            return res.json(200, new_data);
          } else {
            if(i === phases.length - 1) {
              var tmp = JSON.parse(JSON.stringify(new_data)); // The database will try to convert the next field to a date if this line isn't here
              User.findOne({token: req.cookies.token}).exec(function(err, user) {
                if(user.phaseId && user.nextRoom) {
                  tmp.next = "none";
                } else {
                  tmp.next = "your earliest convenience to check again.";
                }

                return res.json(200, tmp);
              });
            } else {
              check(phases, i + 1, callback);
            }
          }
        }

        return check(phases, 0, callback);
      });
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
      // enableFilterQuiet: false

      // pointsMin: '',
      // pointsMax: '',

      // colleges: {
      //   krupp: false,
      //   mercator: false,
      //   nordmetall: false,
      //   c3: false
      // },

      // rooms: {
      //   single: false,
      //   double: false,
      //   triple: false
      // }
    }
  });*/
}

exports.csv = function(req, res) {
  console.log("AAAA");
  var phaseId = req.query.phaseId;
  console.log(phaseId);

  Phase.findOne({id: phaseId}).exec(function(err, phase) {
    if(err || !phase) {
      return res.json(500, err);
    }

    var tmp = [phase.results.krupp, phase.results.mercator, phase.results.c3, phase.results.nordmetall];
    var colleges = ['Krupp', 'Mercator', 'C3', 'Nordmetall'];

    for(var i = 0; i < tmp.length; ++i) {
      for(var j = 0; j < tmp[i].length; ++j) {
        tmp[i][j].college = colleges[i];
      }
    }

    tmp = tmp[0].concat(tmp[1], tmp[2], tmp[3]);

    //var result = json2csv.convert(tmp);
    console.log(tmp);
    return res.csv(tmp, 'Results for ' + phase.name + '.csv', ['name', 'college', 'room']);
  });
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


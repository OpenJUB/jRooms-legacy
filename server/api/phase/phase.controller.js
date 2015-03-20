'use strict';

var _ = require('lodash');
var config = require('./../../config/environment');
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
        var tall = settings.tallPeople.split(',');
        status = (tall.indexOf(user.username) >= 0);
      }

      if(round.filters.enableFilterColleges) {
        var tmp = [];
        if(round.filters.colleges.krupp) {
          tmp.push("Krupp");
        }
        if(round.filters.colleges.mercator) {
          tmp.push("Mercator");
        }
        if(round.filters.colleges.c3) {
          tmp.push("C3");
        }
        if(round.filters.colleges.nordmetall) {
          tmp.push("Nordmetall");
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

    var result = [];
    for(var i = 0; i < data.length; i++) {
      result.push(phaseResult(data[i]));
    }
      calculateColleges(function(colleges) {
        console.log(colleges);
        var result = [];
        //var people = [];

        for(var i = 0; i < 4; ++i) {
          //names.push(colleges[i].college);
          var tmp = [];
          for(var j = 0; j < colleges[i].people.length; ++j) {
            tmp.push(colleges[i].people[j].name);
          }
          //people.push(tmp);
          result.push({
            college: colleges[i].college, 
            people: tmp
          });
        }
        return res.json(200, [{phaseId: 1, name: 'Herp', results: result}]);
      });
  });
}

var calculateColleges = function(callback) {
  User.find({$where: "this.college_preference.length > 0" }).exec(function(err, u) {
      if(err || !u) {
        return res.json(500, err);
      }

      var users = shuffle(u);

      var c3 = [];
      var krupp = [];
      var nordmetall = [];
      var mercator = [];

      for(var i = 0; i < users.length; i++) {
        var tmp = users[i];
        switch(users[i].college_preference[0]) {
          case 'C3':
            c3.push(tmp);
            break;
          case 'Nordmetall':
            nordmetall.push(tmp);
            break;
          case 'Mercator':
            mercator.push(tmp);
            break;
          case 'Krupp':
            krupp.push(tmp);
            break;
        }
      }

      var percentages = [];

      percentages.push({
        people: c3, 
        college: 'C3', 
        fill: collegeFill(c3.length, 'C3')
      }); 

      percentages.push({
        people: mercator, 
        college: 'Mercator', 
        fill: collegeFill(mercator.length, 'Mercator')
      }); 

      percentages.push({
        people: krupp, 
        college: 'Krupp', 
        fill: collegeFill(krupp.length, 'Krupp')
      }); 

      percentages.push({
        people: nordmetall, 
        college: 'Nordmetall', 
        fill: collegeFill(nordmetall.length, 'Nordmetall')
      }); 

      percentages.sort(function(a, b) {
        return a.fill - b.fill;
      });

      console.log(percentages);
      var counter = 0;

      while(percentages[0].fill < config.collegeFillMinimum) {
        var second_choice = [];
        for(var i = 0; i < percentages[3].people; ++i) {
          if(percentages[3].college_preference[1] === percentages[0].name) {
            second_choice.push(i);
          }
        }

        if(second_choice.length === 0) {
          for(var i = 0; i < percentages[3].people; ++i) {
            if(percentages[3].college_preference[2] === percentages[0].name) {
              second_choice.push(i);
            }
          }
        }

        var ind = Math.random() * (second_choice.length - 1);
        var tmp = percentages[3].people[second_choice[ind]];

        percentages[3].people.splice(ind, 1);
        percentages[0].push(tmp);

        percentages[3].fill = collegeFill(percentages[3].people.length, percentages[3].college);
        percentages[0].fill = collegeFill(percentages[0].people.length, percentages[0].college);

        percentages.sort(function(a, b) {
          return a.fill - b.fill;
        });

        counter++;
        if(1000 == counter) {
          break;
        }
      }

      for(var i = 0; i < percentages.length; i++) {
        for(var j = 0; j < percentages[i].people.length; j++) {
            percentages[i].people[j].nextCollege = percentages[i].college;
            percentages[i].people[j].save();
        }
      }

      callback(percentages);
  });
}

var collegeFill = function(number, name) {
  switch(name) {
    case 'C3':
      return 100.0 * number /config.collegeCapacity.c3;
      break;
    case 'Mercator':
      return 100.0 * number /config.collegeCapacity.mercator;
      break;
    case 'Nordmetall':
      return 100.0 * number /config.collegeCapacity.nordmetall;
      break;
    case 'Krupp':
      return 100.0 * number /config.collegeCapacity.krupp;
      break;
  }
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
var shuffle = function (o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var phaseResult = function(item) {
  return {
    id: item.id,
    name: 'A',
    results: [
      'bla',
      'herp',
      'derp'
    ]
  };
}
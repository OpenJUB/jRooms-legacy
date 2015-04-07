'use strict';

var _ = require('lodash');
var User = require('./user.model');
var Phase = require('./../phase/phase.model');
var Admin = require('./../admin/admin.model');
var Room = require('./../room/room.model');
var utils = require('./../../utils');

var freshieTemplate = [
    {
        name: "Banana Potato",
        username: "bpotato",
        imageURL: "http://pbs.twimg.com/profile_images/378800000108340114/a586d7a8df39836a114651aef74cd2d0.jpeg"
    }];

exports.me = function(req, res) {
    var tok = req.cookies.token;
    User.findOne({token: tok}, function(err, user) {
        if(err) {
            return res.json(500, err);
        }
        utils.points(user, function(err, nuser) {
            console.log(err);
            if(!nuser)
                return res.json(200, user);
            user.points = nuser.points;
            user.save(function(err) {

                if(err) {
                    return res.json(500, err);
                }
                
                return res.json(200, nuser);
            });
        });
    });
}

exports.all = function(req, res) {
    User.find({}, function(err, users) {
        var result = [];
        users.forEach(function(user) {
            result.push(user);
        });
        res.write(JSON.stringify(result));
        res.end();
    });
}

exports.add_roommate = function(req, res) {

    var roommate = req.body.username;
    var token = req.cookies.token;
    console.log(token);
    console.log(roommate);

    User.findOne({token: token}).exec(function(err, fromUser) {
        if(err || !fromUser) {
            return res.json(500, err);
        }

        if(_.findIndex(fromUser.outbox, {username: roommate}) > -1 || _.findIndex(fromUser.roommates, {username: roommate}) > -1) {
            return res.json(304, fromUser);
        }

        Phase.find({isCurrent: true}).exec(function(err, phase) {
            if(err || !phase) {
                return res.json(500, err);
            }

            if(fromUser.roommates.length >= phase.maxRoommates) {
                return res.json(400, "There is a limit on the number of roommates, you know...");
            }

            User.findOne({username: roommate}).exec(function(err, toUser) {
                if(err || !toUser) {
                    return res.json(500, err);
                }

                if(fromUser.username === toUser.username) {
                    return res.json(400, "I've heard of doppelgangers but this is ridiculous...");
                }

                if(!fromUser.nextCollege) {
                    return res.json(400, "You need to be allocated to a college first");
                }

                if(fromUser.nextCollege !== toUser.nextCollege) {
                    return res.json(400, "You have to be in the same college as your roommate.");
                }

                fromUser.outbox.push({username: roommate, name: toUser.name, imageURL: toUser.imageURL});
                toUser.inbox.push({username: fromUser.username, name: fromUser.name, imageURL: fromUser.imageURL});

                fromUser.save();
                toUser.save();

                return res.json(200, {status: 'success'});
            });
        });
    });
}

exports.confirm_roommate = function(req, res) {
    var roommate = req.body.username;
    var token = req.cookies.token;
    console.log(token);
    console.log(roommate);

    User.findOne({token: token}).exec(function(err, fromUser) {
        if(err || !fromUser) {
            return res.json(500, err);
        }

        var fromIndex = _.findIndex(fromUser.inbox, {username: roommate});
        if(fromIndex < 0) {
            return res.json(400, "Request does not exist");
        }

        User.findOne({username: roommate}).exec(function(err, toUser) {
            if(err || !toUser) {
                return res.json(500, err);
            }

            for(var i = 0; i < fromUser.roommates.length; i++) {
                if(freshieTemplate.indexOf(fromUser.roommates[i]) >= 0) {
                    fromUser.roommates.splice(i, 1);
                    i--;
                }
            }

            for(var i = 0; i < toUser.roommates.length; i++) {
                if(freshieTemplate.indexOf(toUser.roommates[i]) >= 0) {
                    toUser.roommates.splice(i, 1);
                    i--;
                }
            }

            Phase.findOne({isCurrent: true}).exec(function(err, phase) {
                if(fromUser.roommates.length >= phase.maxRoommates + 1 || toUser.roommates.length >= phase.maxRoommates + 1) {
                    return res.json(400, "One user has more roommates than allowed.");
                }
                var toIndex = _.findIndex(toUser.outbox, {username: fromUser.username});

                fromUser.inbox.splice(fromIndex, 1);
                toUser.outbox.splice(toIndex, 1);

                fromUser.roommates.push({username: roommate, name: toUser.name, imageURL: toUser.imageURL});
                toUser.roommates.push({username: fromUser.username, name: fromUser.name, imageURL: fromUser.imageURL});

                fromUser.save();
                toUser.save();

                return res.json(200, {status: 'success'});
            });
        });
    });   
}

exports.deny_roommate = function(req, res) {
    var roommate = req.body.username;
    var token = req.cookies.token;
    console.log(token);
    console.log(roommate);

    User.findOne({token: token}).exec(function(err, fromUser) {
        if(err || !fromUser) {
            return res.json(500, err);
        }

        var fromIndex = _.findIndex(fromUser.inbox, {username: roommate});
        if(fromIndex < 0) {
            return res.json(400, "Request does not exist");
        }

        User.findOne({username: roommate}).exec(function(err, toUser) {
            if(err || !toUser) {
                return res.json(500, err);
            }

            var toIndex = _.findIndex(toUser.outbox, {username: fromUser.username});

            fromUser.inbox.splice(fromIndex, 1);
            toUser.outbox.splice(toIndex, 1);

            if(fromUser.username === toUser.username) {
                return res.json(400, "I've heard of doppelgangers but this is ridiculous...");
                /*toIndex = _.findIndex(toUser.inbox, {username: toUser.username});
                toUser.inbox.splice(toIndex, 1);

                fromIndex = _.findIndex(fromUser.outbox, {username: fromUser.username});
                fromUser.outbox.splice(toIndex, 1);*/
            }

            fromUser.save();
            toUser.save();

            return res.json(200, {status: 'success'});
        });
    });
}

exports.remove_roommate = function(req, res) {
    var roommate = req.body.username;
    var token = req.cookies.token;

    User.findOne({token: token}).exec(function(err, fromUser) {
        if(err || !fromUser) {
            return res.json(500, err);
        }

        var fromIndex = _.findIndex(fromUser.roommates, {username: roommate});
        if(fromIndex < 0) {
            return res.json(400, roommate + " is not your roommate.");
        }

        var index = _.findIndex(freshieTemplate, {username: roommate});

        if(index >= 0) {
            fromUser.roommates = [];
            fromUser.save(function() {
                return res.json(200, {status: 'success'});
            });
        }

        User.findOne({username: roommate}).exec(function(err2, toUser) {
            if(err2 || !toUser) {
                return res.json(500, err);
            }

            var toIndex = _.findIndex(toUser.roommates, {username: fromUser.username});

            fromUser.roommates.splice(fromIndex, 1);
            toUser.roommates.splice(toIndex, 1);

            fromUser.save();
            toUser.save();

            return res.json(200, {status: 'success'});
        });
    });
}

exports.updateColleges = function(req, res) {
    
    Phase.findOne({isCurrent: true}).exec(function(err, item) {
        if(err || !item) {
            return res.json(500, err);
        }

        if(!item.isCollegePhase) {
            return res.json(400, "The college round is closed");
        }

        User.findOne({token: req.cookies.token}).exec(function(err, user) {
            if(err || !user) {
                return res.json(500, err);
            }
            var new_preference = req.body.colleges;

            var tmp = new_preference.slice();
            tmp.sort();

            if(!_.isEqual(tmp, ['C3', 'Krupp', 'Mercator', 'Nordmetall'])) {
                return res.json(400, "Hack much?");
            }

            user.college_preference = new_preference;
            user.save(function() {
                return res.json(200, {status: 'success'});
            });
        });
    });
}

exports.freshman_roommate = function(req, res) {
    User.findOne({token: req.cookies.token}).exec(function(err, user) {
        if(err || !user) {
            return res.json(500, err);
        }

        if(user.roommates.length > 0) {
            return res.json(400, "You already have a roommate");
        }

        user.hasFreshman = true;
        user.roommates = [random_freshman()];

        user.save(function() {
            res.json(200, user);
        })
    });
}

var random_freshman = function() {
    return freshieTemplate[Math.random() * (freshieTemplate.length - 1)];
}

exports.updateRooms = function(req, res) {
    var rooms = req.body.rooms;
    if(rooms.length === 0) {
        return res.json(304, null);
    }

    Phase.findOne({isCurrent: true}).exec(function(err, p) {
      utils.isEligible(req.cookies.token, p, function(phase) {
        if(!phase.isEligible || phase.isCollegePhase) {
          return res.json(400, "Not eligible for the current round");
        }
        var appliedRooms = _.filter(rooms, function(r) {
            if(r) 
                return true;
            return false;
        });

        Room.find({name: {$in: appliedRooms}}).exec(function(err, rooms) {
          if(err) {
            return res.json(500, err);
          }

          if(phase.filters) {
            if(phase.filters.enableFilterQuiet) {
              for(var i = 0; i < rooms.length; ++i) {
                if(!(rooms[i].college === "Krupp" && rooms[i].block === "A") && !(rooms[i].college === "C3" && rooms[i].block === "D")) {
                  return res.json(400, rooms[i].name + " is not a quiet block room.");
                }

                if(phase.filters.enableFilterRooms && phase.filters.rooms.triple && rooms[i].type !== 'triple') {
                  return res.json(400, rooms[i].name + " is a triple room. Please choose an appropriate room");
                }

                if(phase.filters.enableFilterRooms && phase.filters.rooms.double && rooms[i].type !== 'double') {
                  return res.json(400, rooms[i].name + " is a double room. Please choose an appropriate room");
                }

                if(phase.filters.enableFilterRooms && phase.filters.rooms.single && rooms[i].type !== 'single') {
                  return res.json(400, rooms[i].name + " is a single room. Please choose an appropriate room");
                }
              }
            }

            if(!(phase.filters.rooms && phase.filters.rooms.triple) && appliedRooms.length < 4) {
              return res.json(400, "Please select at least 4 rooms");
            }
          }

          User.findOne({token: req.cookies.token}).exec(function(err, user) {
            if(err || !user) {
              return res.json(500, err);
            }

            Admin.findOne({}).exec(function(err, settings) {
              if(err || !settings) {
                return res.json(500, err);
              }

              for(var i = 0; i < rooms.length; ++i) {
                if(rooms[i].college !== user.nextCollege || settings.disabledRooms.indexOf(rooms[i].name) >= 0) {
                  return res.json(400, rooms[i].name + " is either blocked or not in your college.");
                }
              }

              user.rooms = appliedRooms;
              user.phaseId = phase.id;
              user.save();

              for(var i = 0; i < user.roommates.length; i++) {
                User.findOne({username: user.roommates[i].username}).exec(function(err, user2) {
                  user2.rooms = user.rooms;
                  user2.phaseId = phase.id;
                  user2.save();
                });
              }

              return res.json(200, {status: "success"});
            });
          });
        });
      });
    });
}

exports.switchRooms = function(req, res) {
  var roomName = req.body.room;

  User.findOne({token: req.cookies.token}).exec(function(err, user) {
    if(err || !user) {
      return res.json(500, err);
    }

    Room.findOne({name: roomName}).exec(function(err, room) {
      if(err || !room) {
        return res.json(500, err);
      }

      var found = false;

      var usernames = _.pluck(item.roommates, 'username');
      User.find({username: {$in: usernames}}).exec(function(err, roommates) {
        for(var i = 0; i < roommates.length; ++i) {
          if(roommates[i].nextRoom === roomName) {
            found = true;
            roommates[i].nextRoom = user.nextRoom;
            user.nextRoom = roomName;
            user.save(function() {
              roommates.save(function(){
                return res.json(200, null);
              });
            });
            break;
          }
        }

        if(!found) {
          return res.json(400, "Nice try :)");
        }
      });
    });
  });
}
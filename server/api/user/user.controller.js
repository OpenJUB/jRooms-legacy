'use strict';

var _ = require('lodash');
var User = require('./user.model');
var Phase = require('./../phase/phase.model');
var Admin = require('./../admin/admin.model');
var Room = require('./../room/room.model');
var utils = require('./../../utils');
var config = require('./../../config/environment/');

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
      user.isAdmin = (config.admins.indexOf(nuser.username) >= 0);
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

            /*if(fromUser.roommates.length >= phase.maxRoommates) {
                return res.json(400, "There is a limit on the number of roommates, you know...");
            }*/

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

            var fromFresh = _.intersection(freshieTemplate, fromUser.roommates);
            if(fromFresh.length > 0) {
              fromUser.roommates = [];
            }

            var toFresh = _.intersection(freshieTemplate, toUser.roommates);
            if(toFresh.length > 0) {
              toUser.roommates = [];
            }

            Phase.findOne({isCurrent: true}).exec(function(err, phase) {
                /*if(fromUser.roommates.length >= phase.maxRoommates + 1 || toUser.roommates.length >= phase.maxRoommates + 1) {
                    return res.json(400, "One user has more roommates than allowed.");
                }*/
                var toIndex = _.findIndex(toUser.outbox, {username: fromUser.username});

                fromUser.inbox.splice(fromIndex, 1);
                toUser.outbox.splice(toIndex, 1);

                fromUser.roommates.push({username: roommate, name: toUser.name, imageURL: toUser.imageURL});
                toUser.roommates.push({username: fromUser.username, name: fromUser.name, imageURL: fromUser.imageURL});

                var people = _.union(fromUser.roommates, toUser.roommates);
                var peopleNames = _.pluck(people, 'username');

                fromUser.roommates = _.filter(people, function(p) {
                  return p.username !== fromUser.username;
                });
                fromUser.save(function() {
                  User.find({username: {$in: peopleNames}}).exec(function(err, all) {
                    if(err || !all) {
                      return res.json(500, err);
                    }

                    for(var i = 0; i < all.length; ++i) {
                      if(all[i].username === fromUser.username) {
                        continue;
                      }

                      all[i].roommates = _.filter(people, function(p) {
                        return p.username !== all[i].username;
                      });
                      all[i].save();
                    }

                    return res.json(200, {status: 'success'});
                  });
                });
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
            fromUser.phaseId = null;
            fromUser.rooms = [];
            fromUser.save();
                
            return res.json(200, {status: 'success'});
        }

        var usernames = _.pluck(fromUser.roommates, 'username');
        User.find({username: {$in: usernames}}).exec(function(err, roommates) {

            if(err || !roommates) {
                return res.json(500, err);
            }

            fromUser.roommates = [];
            fromUser.phaseId = null;
            fromUser.rooms = [];
            fromUser.save();

            for(var i = 0; i < roommates.length; i++) {
              roommates[i].roommates = [];
              roommates[i].phaseId = null;
              roommates[i].rooms = [];
              roommates[i].save();
            }

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

            user.phaseId = item.id;
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

    Phase.findOne({isCurrent: true}).exec(function(err, p) {
      utils.isEligible(req.cookies.token, p, function(phase) {
        if(!phase) {
          return res.json(500, "No active phase");
        }
        if(!phase.isEligible || phase.isCollegePhase) {
          return res.json(400, "Not eligible for the current round");
        }
        var uniqueRooms = _.filter(rooms, function(r) {
            if(r) 
                return true;
            return false;
        });

        var appliedRooms = [];
        for(var i = 0; i < uniqueRooms.length; ++i) {
          var r = uniqueRooms[i].split(',');
          appliedRooms = _.union(appliedRooms, r);
        }

        console.log(appliedRooms);

        if(appliedRooms.length < 4) { // NOTE: Different from the if check below. This accounts for triple apartments as well.
          return res.json(400, "Please select at least 4 rooms");
        }

        Room.find({name: {$in: appliedRooms}}).exec(function(err, rooms) {
          if(err) {
            return res.json(500, err);
          }

          if(phase.filters) {
            for(var i = 0; i < rooms.length; ++i) {
              if(!rooms[i].isAvailable) {
                return res.json(400, "Sorry, there is someone already living in " + rooms[i].name);
              }

              if(phase.filters.enableFilterQuiet) {
                if(!(rooms[i].college === "Krupp" && rooms[i].block === "A") && !(rooms[i].college === "C3" && rooms[i].block === "D")) {
                  return res.json(400, rooms[i].name + " is not a quiet block room.");
                }
              }
              if(phase.filters.enableFilterRooms) {
                if(phase.filters.rooms.triple && rooms[i].type !== 'triple') {
                  return res.json(400, rooms[i].name + " is not a triple room. Please choose an appropriate room");
                }
                if(phase.filters.rooms.double && rooms[i].type !== 'double') {
                  return res.json(400, rooms[i].name + " is not a double room. Please choose an appropriate room");
                }
                if(phase.filters.rooms.single && rooms[i].type !== 'single') {
                  return res.json(400, rooms[i].name + " is not a single room. Please choose an appropriate room");
                }

                if(!phase.filters.rooms.triple && uniqueRooms.length < 4) { // Don't remove this one. It's different from the one above.
                  return res.json(400, "Please select at least 4 rooms");
                }
              }
            }


            if(phase.filters.enableFilterTall) {
              var number = rooms[i].name.substring(4, 2);
              if(number != "08" && number != "09" && number != "36" && number != "37") {
                return res.json(400, rooms[i].name + " is not a tall room. Please select an appropriate room");
              }
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

              if(!user.rooms || (user.rooms.length === 0) || (user.rooms.length && user.rooms[0] !== uniqueRooms[0])) {
                var upd = uniqueRooms[0].split(',');
                Room.find({name: {$in: upd}}).exec(function(err, data) {
                  if(err || !data) {
                    return;
                  }

                  for(var i = 0; i < data.length; ++i) {
                    data[i].applicants += 1;
                    data[i].save();
                  }
                });
              }

              if(user.rooms && user.rooms.length && user.rooms[0] !== uniqueRooms[0]) {
                var upd = user.rooms[0].split(',');
                Room.find({name: {$in: upd}}).exec(function(err, data) {
                  if(err || !data) {
                    return;
                  }

                  for(var i = 0; i < data.length; ++i) {
                    data[i].applicants -= 1;
                    data[i].save();
                  }
                });
              }
              user.rooms = uniqueRooms;
              user.phaseId = phase.id;
              user.save();

              for(var i = 0; i < user.roommates.length; i++) {
                User.findOne({username: user.roommates[i].username}).exec(function(err, user2) {
                    if(err || !user2) {
                        return;
                    }
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

      if(room.rooms.indexOf(user.nextRoom) < 0) {
        return res.json(400, "Nice try :)");
      }

      var usernames = _.pluck(user.roommates, 'username');
      User.find({username: {$in: usernames}}).exec(function(err, roommates) {
        if(err) {
          return res.json(500, err);
        }

        for(var i = 0; i < roommates.length; ++i) {
          if(roommates[i].nextRoom === roomName) {
            roommates[i].nextRoom = user.nextRoom;
            roommates[i].save();
            break;
          }
        }

        user.nextRoom = roomName;
        user.save();
        return res.json(200, {});
      });
    });
  });
}

exports.addPoint = function(req, res) {
    var college = req.body.college;
    ++global.collegeGame[college];

    return res.json(200, "1 point to Griffyndor!");
}
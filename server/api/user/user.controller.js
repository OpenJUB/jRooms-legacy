'use strict';

var _ = require('lodash');
var User = require('./user.model');
var Phase = require('./../phase/phase.model');
var Admin = require('./../admin/admin.model');
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
            user.points = nuser.points;
            user.save();
            return res.json(200, nuser);
        });
    });
}

/*exports.points = function(req, res) {
    exports.get_by_token(req.cookies.token, function(user) {
        res
        .status(200)
        .send(exports.calculate(user));
    });
}

exports.calculate = function(user) { // Returns item that contains how many points the user got for each section. Should be externally controlled by a config file later on.

    // Get individual points
    var points = new Object();
    points.magic_number = (new Date().getFullYear() - 2000) - user.graduation_year  + 3;
    points.year_points = points.magic_number; // 2 points if graduating next year, 1 if in 2 years.
    points.college_spirit = 0.5 * (1 - (user.current_college === user.next_college)); // 0.5 points if same college, 0 if in different

    points.individual_points = points.year_points + points.college_spirit;
    points.total = points.individual_points;
    // Get roommate points
    if(!user.roommates && user.roommates !== null) {
        //console.log(user.roommates);
        user.roommates.forEach(function(username) {
            exports.get(username, function(err, roommate) {
                points.nationality_points = 2 * (user.nationality != roommate.nationality);
                points.region_points = 1*(exports.get_region(user.id) != exports.get_region(roommate.id));
                points.roommate_points = points.nationality_points + points.region_points;
                points.total += points.roommate_points;
            });
        });
    }
    return points;
}

exports.get_region = function(userId) {
    return "SE Europe"; //config file
}

exports.get = function(username, callback) {
    User.findOne({username: username}, function(err, data) {
        callback(err, data);
    })
}

exports.get_by_token = function(tok, callback) {
    User.findOne( {token: tok}, function(err, user) {
        callback(user);
    });
}

exports.reset_users = function(req, res) {
    var updated = exports.update_users();
    res.send(updated);
}

/*exports.update_users = function() {
    if(config.started)
        return "Cannot update the user database";

    User.find({}).remove().exec();

    var ldap_users = [
        new User({
            name : "Filip",
            surname : "Stankovski",
            nationality : "Macedonia",
            graduation_year : 2017,
            roommates : [],
            username : "fstankovsk",
            current_college : "C3",
            next_college : "C3",
            token : "aaa"
        }),
        new User({
            name : "Dmitrii",
            surname : "Cucleschin",
            nationality : "Moldova",
            graduation_year : 2016,
            roommates : [],
            username : "dcucleschi",
            current_college : "Krupp",
            next_college : "C3"
        }),
        new User({
            name : "Vlad",
            surname : "Ungureanu",
            nationality : "Romania",
            graduation_year : 2015,
            roommates : [],
            username : "vungureanu",
            current_college : "Krupp",
            next_college : "Nordmetall"
        })
    ]; // Should get ALL people from LDAP
    for(i = 0; i < ldap_users.length; i++) {

        ldap_users[i].save();
    }
    // console.log(JSON.stringify(ldap_users));
    return JSON.stringify(ldap_users);
}*/

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
    User.findOne({token: req.cookies.token}).exec(function(err, user) {
        user.rooms = rooms;
        user.save();

        for(var i = 0; i < user.roommates; i++) {
            User.findOne({username: user.roommates[i].username}).exec(function(err, user2) {
                user2.rooms = rooms;
                user2.save();
            });
        }

        return res.json(200, {status: "success"});
    });
}
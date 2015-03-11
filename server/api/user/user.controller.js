'use strict';

var _ = require('lodash');
var User = require('./user.model');

exports.me = function(req, res) {
    var tok = req.cookies.token;
    exports.get_by_token(tok, function(user) {
        if(user) {
            res
            .status(200)
            .send(user);
        } else {
            res
            .status(404)
            .send("You don't exist");
        }
    });
}

exports.points = function(req, res) {
    exports.get_by_token(req.cookies.token, function(user) {
        res
        .status(200)
        .send(exports.calculate(user));
    });
}

exports.calculate = function(user) { // Returns item that contains how many points the user got for each section. Should be externally controlled by a config file later on.

    // Get individual points
    var points = new Object();
    points.magic_number = (new Date().getFullYear()) - user.graduation_year  + 3;
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

    if(!active_round.filters.roommate_phase) {
        res.status(400).send("Phase not active");
    }
    var roommate = req.body.roommate;
    if(!roommate) { // Rooming with a freshman.
        User.update({token: req.cookies.token}, {roommate: [{
            username: "bpotato",
            name: "Banana Potato",
            surname: "Potato",
            nationality: "Disney"
        }]}, function(err, data) {
            if(err) {
                res
                .status(500)
                .send("Unknown error in add_roommate");
            }
            User.findOne({token: req.cookies.token}, function(err, data2) {
                res
                .status(200)
                .send(data2);
            });
        })
    }
    exports.get_by_token(req.cookies.token, function(result) { // Get current user(will need the username later)
        if(result.pending_outgoing_roommate_requests.indexOf(roommate) > -1) { // If the user is already listed as a roommate then return Not Modified
            res
            .status(304)
            .send(result);
            return;
        }
        // Else, update in both places.
        User.update({token: req.cookies.token}, {
                                                 $push: {pending_outgoing_roommate_requests: roommate}//,
                                                 //$pull: {roommates: ["bpotato"]}
                                                }, function(err, data) {
            if(!data || data === 0) {
                res
                .status(500)
                .send("Unexpected error.");
                return;
            }

            User.update({username: roommate}, {$push: {pending_incoming_roommate_requests: result.username}}, function(error, updateResult) {
                if(!updateResult || updateResult === 0) {
                    res
                    .status(500)
                    .send("Unexpected error.");
                    return;
                }
                exports.get_by_token(req.cookies.token, function(user) {
                    res
                    .status(200)
                    .send(user);
                })
            });
        });
    });
}

exports.confirm_roommate = function(req, res) {
    if(!active_round.filters.roommate_phase) {
        res.status(400).send("Phase not active");
    }
    var roommate = req.body.roommate;
    exports.get_by_token(req.cookies.token, function(result) { // Get current user(will need the username later)
        if(result.roommates.length >= active_round.filters.roommate_limit) {
            res.status(400).send("Too many roommates");
        }
        if(result.pending_incoming_roommate_requests.indexOf(roommate) === -1) { // If the user is already listed as a roommate then return Not Modified
            res
            .status(404)
            .send(result);
            return;
        }
        // Else, update in both places.
        User.update({token: req.cookies.token}, {$pull: {pending_incoming_roommate_requests: roommate}, 
                                                 $push: {roommates: roommate}}, function(err, data) {
            if(!data || data === 0) {
                res
                .status(500)
                .send("Unexpected error.");
                return;
            }

            User.update({username: roommate}, {$pull: {pending_outgoing_roommate_requests: result.username},
                                               $push: {roommates: result.username}}, function(error, updateResult) {
                if(!updateResult || updateResult === 0) {
                    res
                    .status(500)
                    .send("Unexpected error.");
                    return;
                }
                exports.get_by_token(req.cookies.token, function(user) {
                    res
                    .status(200)
                    .send(user);
                })
            });
        });
    });
}

exports.deny_roommate = function(req, res) {
    if(!active_round.filters.roommate_phase) {
        res.status(400).send("Phase not active");
    }

    var roommate = req.body.roommate;
    exports.get_by_token(req.cookies.token, function(result) {
        if(result.pending_incoming_roommate_requests.indexOf(roommate) === -1) { // If the user is already listed as a roommate then return Not Modified
            res
            .status(404)
            .send(result);
            return;
        }

        User.update({token: req.cookies.token}, {$pull: {pending_incoming_roommate_requests: roommate}}, function(err, data) {

            if(!data || data === 0) {
                res
                .status(500)
                .send("Unexpected error.");
                return;
            }

            User.update({username: roommate}, {$pull: {pending_outgoing_roommate_requests: result.username}}, function(error, updateResult){

                exports.get_by_token(req.cookies.token, function(user) {
                    res.status(200).send(user);
                    return;
                });
            });

        });
    });
}

exports.updateColleges = function(req, res) {
    //console.log(req);
    if(!active_round.filters.college_phase) {
        res
        .status(403)
        .send("The college phase is not active");
        return;
    }
    var new_preference = req.body.colleges;
    //console.log("AAAAAAAAAAAAAAAAA" + new_preference);
    User.update({token: req.cookies.token}, {college_preference: new_preference}, function(err, numAffected) {
        if(err) {
            res
            .status(404)
            .send(err);
            return;
        }

        User.findOne({token: req.cookies.token}, function(err, data) {
            res
            .status(200)
            .send(data);
            return;
        })
    });
}

exports.is_eligible = function(user, round) {
    if(!round) {
        return true;
    }

    if(user.is_exchange && !round.filters.exchange_students) {
        return false;
    }

    if(!user.is_tall && round.filters.tall_people) {
        return false;
    }
    var points = exports.calculate(user).total;
    if( points < round.filters.points) {
        return false;
    }

    if(user.roommates.length !== 0 && round.filters.roomType === "Single") {
        return false;
    }

    if(user.roommates.length !== 1 && round.filters.roomType === "Double") {
        return false;
    }

    if(user.roommates.length !== 2 && round.filters.roomType === "Triple") {
        return false;
    }

    if(round.filters.college.indexOf(user.next_college) === -1) {
        return false;
    }

    return true;
}
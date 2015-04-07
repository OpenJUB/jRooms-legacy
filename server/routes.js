/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var cookieParser = require('cookie-parser');
var json2csv = require('nice-json2csv');
var request = require('request');
var bodyParser = require('body-parser');
var User = require('./api/user/user.model');
var Admin =  require('./api/admin/admin.model');
var utils = require('./utils');
var config = require('./config/environment');


module.exports = function(app) {

  app.use(cookieParser());
  app.use(json2csv.expressDecorator);  

  app.use( bodyParser.json() );       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  })); 

  app.use('/api', function(req, res, next) {
    console.log(req.originalUrl);

    var token = req.cookies.token;
    if(!token) {
      return res.json(401, "Invalid access token");
    }

    request.cookie('openjub_session=' + token);
    request({
      method: 'GET',
      uri : config.openJUB.url + "user/me?token=" + token,
      params : { 'openjub_session' : token },
      headers: {'Cookie' : 'openjub_session=' + token}
    }, function(err, response) {

        var username = JSON.parse(response.body).username;
        // console.log(JSON.parse(response.body));
        if(!username) {
          return res.json(401, "Unauthorized. Invalid user returned by OpenJUB");
        }

        Admin.findOne({}).exec(function(errF, settings) {
          if(errF) {
            return res.json(500, err);
          }

          if(settings && settings.disabledUsers.indexOf(username) >= 0) {
            return res.json(403, "You are on the list of disabled users.");
          }

          User.update({username: username}, {token: token}, function(err2, num_affected) {
            if(err2) {
              return res.json(500, "Database failure");
            }
            console.log(num_affected);

            if(num_affected == 0 && config.admins.indexOf(username) > -1) {
              console.log("AA");
              utils.AddOpenJubUser(JSON.parse(response.body), token, function(err, user) {
                console.log(user);
                if(err || !user) {
                  return res.json(500, err);
                } else {
                  return next();
                }
              });
            }

            if(req.originalUrl.indexOf("/admin") === 0) { //on an admin route, check the config
              console.log("Admin route");
              if(config.admins.indexOf(username) > -1)
                return next();
              return res.json(403, "Access denied");
            } else {
              console.log("User route");
              return next();
            }
        });

        });
    });
  });

  // Insert routes below
  app.use('/api/room/', require('./api/room'));
  app.use('/api/phase', require('./api/phase'));
  app.use('/api/admin', require('./api/admin'));
  app.use('/api/user', require('./api/user'));
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};

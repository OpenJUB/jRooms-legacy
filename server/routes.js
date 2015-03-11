/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var cookieParser = require('cookie-parser');
var request = require('request');
var bodyParser = require('body-parser');
var User = require('./api/user/user.model');


module.exports = function(app) {

  app.use(cookieParser());

  app.use( bodyParser.json() );       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  })); 

  app.use('/api', function(req, res, next) {
    console.log(req.originalUrl);
    //if(req.originalUrl === "/api/user/me") {
     // return next();
    //}
    var token = req.cookies.token;
    if(!token) {
      res
      .status(401)
      .send("Invalid access token");
      return;
    }
    request.cookie('openjub_session=' + token);
    request({
      method: 'GET',
      uri : "https://api.jacobs-cs.club/auth/status?token=" + token,
      params : { 'openjub_session' : token },
      headers: {'Cookie' : 'openjub_session=' + token}
    }, function(err, response) {
      console.log(response.body);
      console.log(JSON.parse(response.body).user);
      if(!JSON.parse(response.body).user) {
        res
        .status(401)
        .send("Unauthorized. Invalid user returned by OpenJUB");
        return;
      }

      User.update({username: JSON.parse(response.body).user}, {token: token}, function(err2, num_affected){
          if(err) {
            return res.status(500).send("Database failure");
          }

          if(req.originalUrl.indexOf("/admin") === 0) { //on an admin route, check the config
            console.log("Admin route");
            return next();
          } else {
            console.log("User route");
            return next();
          }
      });

    });
  });

  // Insert routes below
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

'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Should we populate the DB with sample data?
  seedDB: false,

  // Admins for the room allocation
  admins: [ 'dcucleschi', 'fstankovsk', 'vungureanu' ],

  // Number of students that can be allocated to the college
  collegeCapacity: {
    c3: 100,
    krupp: 100,
    nordmetall: 100,
    mercator: 100
  },

  // Boundary percentages for colleges
  collegeFillMinimum: 0,
  collegeFillMaximum: 100,

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  // Points
  collegeSpiritPoints: 0.5,
  countryPoints: 2,
  regionPoints: 1,
  majorPoints: 1,

  // Regions
  regions: {
    eastEurope: ["Macedonia", "Georgia"],
    westEurope: [],
    middleEast: [],
    northAmerica: [],
    southAmerica: [],
    southEastAsia: [],
    southAsia: [],
    northAfrica: [],
    southAfrica: []
  },

  openJUB: {
    url: "https://api.jacobs-cs.club/"
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
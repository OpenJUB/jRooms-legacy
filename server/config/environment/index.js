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
  admins: [ 'slal','dcucleschi','fstankovsk','twiesing','mfieraru','lkuboschek' ],

  // Number of students that can be allocated to the college
  collegeCapacity: {
    c3: 280,
    krupp: 240,
    nordmetall: 250,
    mercator: 240
  },

  // Boundary percentages for colleges
  collegeFillMinimum: 60,
  collegeFillMaximum: 75,

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
    eastEurope: ['Albania', 'Armenia', 'Belarus', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Czech Republic', 'Estonia', 'Georgia', 'Hungary', 'Latvia', 'Lithuania', 'Macedonia', 'Moldova', 'Montenegro', 'Poland', 'Romania', 'Russia', 'Serbia', 'Slovakia', 'Slovenia', 'Kosovo', 'Ukraine'],
    westEurope: ['Andorra', 'Austria', 'Belgium', 'Cyprus', 'Denmark', 'Finland', 'Greece', 'Iceland', 'Ireland', 'Italy', 'Liechtenstein', 'Luxembourg', 'Malta', 'Monaco', 'Netherlands', 'Norway', 'Portugal', 'San Marino', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom', 'Vatican City'],
    middleEast: [],
    northAmerica: ['Canada', 'USA'],
    latinAmerica: ['Argentina', 'Bahamas', 'Barbaros', 'Belize', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Grenada', 'Guatemala', 'Guyana', 'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Saint Vincent & the Grenadines', 'St Kitts & Nevis', 'St Lucia', 'Suriname', 'Trinidad & Tobago', 'Uruguay', 'Venezuela'],
    southEastAsia: [],
    southAsia: [],
    westAfrica: ['Benin', 'Burkina Faso', 'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Congo', 'Democratic Republic of the Congo', 'Equiatorial Guinea', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Liberia', 'Mali', 'Mauritania', 'Niger', 'Nigeria', 'Sao Tome and Principe', 'Senegal', 'Sierra Leone', 'Togo'],
    southAfrica: ['Angola', 'Botswana', 'Burundi', 'Comoros', 'Djibouti', 'Eritrea', 'Ethiopia', 'Kenya', 'Lesotho', 'Madagascar', 'Malawi', 'Mauritius', 'Mozambique', 'Namibia', 'Rwanda', 'Seychelles', 'Somalia', 'South Africa', 'Swaziland', 'Tanzania', 'Uganda', 'Zambia', 'Zimbabwe']
  },

  openJUB: {
    url: "https://api.jacobs-cs.club/"
  },

  email: {
    user: "",
    pass: "",
    host: "exchange.jacobs-university.de",
    port: 25,
    address: "email@jacobs-university.de"
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
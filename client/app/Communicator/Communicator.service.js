'use strict';

angular.module('jRoomsApp').service('Communicator', function ($http) {

  this.openJUB = 'https://api.jacobs-cs.club';
  this.server = 'http://localhost:3000';

  this.sendGET = function(route, body, fn) {
    $http.get(this.server + route, body)
      .success(function(data, status, headers, config) {
        fn(null, data);
      })
      .error(function(data, status, headers, config) {
        fn({ status: status, error: data }, null);
      });
  }

  this.sendPOST = function(route, body, fn) {
    $http.post(this.server + route, body)
      .success(function(data, status, headers, config) {
        fn(null, data);
      })
      .error(function(data, status, headers, config) {
        fn({ status: status, error: data }, null);
      });
  }

  this.getCurrentUser = function(fn) {
    this.sendGET('/user/me', {}, fn);
  }

});

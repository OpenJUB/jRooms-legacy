'use strict';

angular.module('jRoomsApp').service('Communicator', function ($http) {

  this.openJUB = 'https://api.jacobs-cs.club';

  this.sendGET = function(route, body, fn) {
    $http.get(route, body)
      .success(function(data, status, headers, config) {
        fn(null, data);
      })
      .error(function(data, status, headers, config) {
        fn({ status: status, error: data }, null);
      });
  }

  this.sendPOST = function(route, body, fn) {
    $http.post(route, body)
      .success(function(data, status, headers, config) {
        fn(null, data);
      })
      .error(function(data, status, headers, config) {
        fn({ status: status, error: data }, null);
      });
  }

  this.getCurrentUser = function(fn) {
    this.sendGET('/api/user/me', {}, fn);
  }

  this.requestRoommate = function(cid, fn) {
    this.sendPOST('/api/user/requestRoommate', { username : cid }, fn);
  }

  this.acceptRoommate = function(cid, fn) {
    this.sendPOST('/api/user/acceptRoommate', { username : cid }, fn);
  }

  this.denyRoommate = function(cid, fn) {
    this.sendPOST('/api/user/denyRoommate', { username : cid }, fn);
  }

  this.getProfileImage = function(cid) {
    if (cid == null) return null;
    return this.openJUB + '/user/image/' + cid + '/image.jpg';
  }
});

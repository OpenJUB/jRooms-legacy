'use strict';

angular.module('jRoomsApp').service('Communicator', function ($http) {

  this.openJUB = 'https://api.jacobs-cs.club';

  this.sendGET = function(route, body, fn) {
    $http.get(route, { params: body })
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

  // /user
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

  this.updateColleges = function(arr, fn) {
    this.sendPOST('/api/user/updateColleges' , { colleges : arr }, fn);
  }

  this.updateRooms = function(arr, fn) {
    this.sendPOST('/api/user/updateColleges' , { colleges : arr }, fn);
  }

  this.getProfileImage = function(cid) {
    if (cid == null) return null;
    return this.openJUB + '/user/image/' + cid + '/image.jpg';
  }

  // phase
  this.currentPhase = function(fn) {
    this.sendGET('/api/phase/current', {}, fn);
  }

  // /admin
  this.currentSettings = function(fn) {
    this.sendGET('/api/admin/currentSettings', {}, fn);
  }

  this.updateSettings = function(dict, fn) {
    this.sendPOST('/api/admin/updateSettings', { settings : dict }, fn);
  }

  this.importUsers = function(fn) {
    this.sendGET('/api/admin/importUsers', {}, fn);
  }

  this.getUser = function(cid, fn) {
    this.sendGET('/api/admin/getUser', { username : cid }, fn);
  }

  this.setUser = function(cid, user, fn) {
    this.sendPOST('/api/admin/setUser', { username : cid, user : user }, fn)
  }

  this.resetSystem = function(fn) {
    this.sendGET('/api/admin/resetSystem', {}, fn);
  }
});

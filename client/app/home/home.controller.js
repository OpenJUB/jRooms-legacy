'use strict';

angular.module('jRoomsApp')
  .controller('HomeCtrl', function ($rootScope, $scope, $location, State, Communicator) {
    $scope.user = {};
    $scope.requestUsername = '';
    $scope.colleges = ['Krupp', 'Nordmetall', 'Mercator', 'C3'];
    $scope.rooms = [''];
    $scope.maxRooms = [];

    $scope.currentPhase = {};
    $scope.showNotEligible = false;
    $scope.showCollegeSelection = false;
    $scope.showRoomSelection = false;
    $scope.showDone = false;
    $scope.showError = false;

  	$scope.$watch(State.user, function(val) {
        if (val && val.username) {
          $scope.user = val;

          if (val.college_preference.length === 4) $scope.colleges = val.college_preference;
          if (val.room_preferences.length > 0) $scope.rooms = val.room_preferences;
        }
        else {
          $scope.user = {};
        }
    }, true);

    Communicator.currentPhase(function(err, phase) {
      if (!err) {
        $scope.currentPhase = phase;

        if (!phase.isEligible) {
          if (phase.next == 'none') {
            $scope.showDone = true;
          }
          else {
            $scope.showNotEligible = true;
          }
        }
        else {
          if (phase.isCollegePhase) {
            $scope.showCollegeSelection = true;
          }
          else {
            $scope.rooms = new Array(phase.maxRooms);
            $scope.maxRooms = _.range(0, phase.maxRooms);

            $scope.showRoomSelection = true;
          }
        }
      }
      else {
        $scope.showError = true;
      }
    });

    $scope.requestRoommate = function() {
      //console.log("Sending request to " + $scope.requestUsername);
      Communicator.requestRoommate($scope.requestUsername, function(err, data) {
        if (!err && data) {
          $rootScope.showAlert({
            type: 'success',
            msg: 'Successfully sent the roommate request to ' + $scope.requestUsername + '!'
          });
        }
        else {
          $rootScope.showAlert({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while sending a roommate request!'
          });
        }

        $scope.requestUsername = '';
      });
    }

    $scope.requestFreshman = function() {
      Communicator.requestFreshman(function (err, data) {
        if (!err) {
          $rootScope.showAlert({
            type: 'success',
            msg: 'Successfully requested a freshie as a roommate!'
          });
        }
        else {
          $rootScope.showAlert({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while requesting a freshie roommate!'
          });
        }
      });
    }

    $scope.acceptRoommate = function(cid) {
      //console.log("Accepting request from " + cid);
      Communicator.acceptRoommate(cid, function(err, data) {
        if (!err && data) {
          $rootScope.showAlert({
            type: 'success',
            msg: 'Successfully accepted a roommate request from ' + cid + '!'
          });

          $scope.user.inbox = _.filter($scope.user.inbox, function(val) { val.username !== cid });
        }
        else {
           $rootScope.showAlert({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while accepting a roommate request!'
          });
        }
      });
    }

    $scope.denyRoommate = function(cid) {
      //console.log("Denying request from " + cid);
      Communicator.denyRoommate(cid, function(err, data) {
        if (!err && data) {
          $rootScope.showAlert({
            type: 'success',
            msg: 'Successfully denied the roommate request from ' + cid + '!'
          });

          $scope.user.inbox = _.filter($scope.user.inbox, function(val) { val.username !== cid });
        }
        else {
           $rootScope.showAlert({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while denying the roommate request!'
          });
        }
      });
    }

    $scope.removeRoommate = function(cid) {
      Communicator.removeRoommate(cid, function(err, data) {
        if (!err) {
          $rootScope.showAlert({
            type: 'success',
            msg: 'Successfully removed ' + cid + ' from roommates!'
          });

          $scope.user.roommates = _.filter($scope.user.roommates, function(val) { val.username !== cid });
        }
        else {
          $rootScope.showAlert({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while removing roommate!'
          });
        }
      })
    }

    $scope.updateColleges = function() {
      if ($scope.colleges.length != _.uniq($scope.colleges).length) {
        $rootScope.showAlert({
          type: 'danger',
          msg: 'Oh oh! Please, make sure that you didn\'t select the same college twice!'
        });
        return;
      }

       Communicator.updateColleges($scope.colleges, function(err, data) {
        if (!err && data) {
          $rootScope.showAlert({
            type: 'success',
            msg: 'Successfully updated colleges!'
          });
        }
        else {
         $rootScope.showAlert({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while updating college selections!'
          });
        return;
        }
      });

    }

    $scope.updateRooms = function() {
      //console.log($scope.rooms);
      Communicator.updateRooms($scope.rooms, function(err, data) {
        if (!err && data) {
           $rootScope.showAlert({
            type: 'success',
            msg: 'Successfully updated rooms!'
          });
        }
        else {
           $rootScope.showAlert({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while updating room selections!'
          });
        }
      });
    }

    $scope.collegeButton = function(college) {
      if (college === 'Krupp') {

      }
      else if (college === 'Mercator') {

      }
      else if (college === 'C3') {

      }
      else if (college === 'Nordmetall') {

      }
    }

  });

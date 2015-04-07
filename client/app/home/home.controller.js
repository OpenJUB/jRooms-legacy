'use strict';

angular.module('jRoomsApp')
  .controller('HomeCtrl', function ($rootScope, $scope, $location, State, Communicator) {
    $scope.user = {};
    $scope.requestUsername = '';
    $scope.colleges = ['Krupp', 'Nordmetall', 'Mercator', 'C3'];
    $scope.rooms = [];
    $scope.maxRooms = [];
    $scope.futureRoom = {};
    $scope.roomToSwap = null;

    $scope.currentPhase = {};
    $scope.showNotEligible = false;
    $scope.showCollegeSelection = false;
    $scope.showRoomSelection = false;
    $scope.showDone = false;
    $scope.isDropdownOpen = false;
    $scope.showError = false;

  	$scope.$watch(State.user, function(val) {
        if (val && val.username) {
          $scope.user = val;
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
            Communicator.getCurrentRoom($scope.user.nextRoom, function(err, data) {
              if (!err && data) {
                $scope.futureRoom = data;
                $scope.roomToSwap = $scope.user.nextRoom;
                $scope.showDone = true;
              }
              else {
                $scope.showError = true;
                $rootScope.showAlert({
                  type: 'danger',
                  msg: 'Oh oh! ' + err.error
                });
              }
            });
          }
          else {
            $scope.showNotEligible = true;
          }
        }
        else {
          if (phase.isCollegePhase) {
            if ($scope.user.college_preference.length === 4) $scope.colleges = $scope.user.college_preference;
            $scope.showCollegeSelection = true;
          }
          else {
            $scope.rooms = $scope.user.rooms;
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
            msg: 'Oh oh! ' + err.error
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
            msg: 'Oh oh! ' + err.error
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
            msg: 'Oh oh! ' + err.error
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
            msg: 'Oh oh! ' + err.error
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
            msg: 'Oh oh! ' + err.error
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
            msg: 'Oh oh! ' + err.error
          });
        return;
        }
      });

    }

    $scope.updateRooms = function() {
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
            msg: 'Oh oh! ' + err.error
          });
        }
      });
    }

    $scope.switchRoom = function() {
      Communicator.switchRoom($scope.roomToSwap, function(err, data) {
        if (!err && data) {
          $scope.user.nextRoom = $scope.roomToSwap;
           $rootScope.showAlert({
            type: 'success',
            msg: 'Successfully switched rooms!'
          });
        }
        else {
           $rootScope.showAlert({
            type: 'danger',
            msg: 'Oh oh! ' + err.error
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

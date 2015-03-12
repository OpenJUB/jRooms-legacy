'use strict';

angular.module('jRoomsApp')
  .controller('HomeCtrl', function ($scope, $location, State, Communicator) {
    $scope.user = {};
    $scope.profileImg = 'http://placehold.it/100x150';
    $scope.requestUsername = '';
    $scope.colleges = ['Krupp', 'Nordmetall', 'Mercator', 'C3'];
    $scope.rooms = [''];

  	// Redirect logged out users
  	// $scope.$watch(State.loggedIn, function(val) {
  	// 	if (!val) {
  	// 		$location.path('/');
  	// 	}
  	// });

  	$scope.$watch(State.user, function(val) {
        if (val && val.username) {
          $scope.user = val;
          $scope.profileImg = Communicator.getProfileImage(val.username);
        }
        else {
          $scope.user = {};
        }
    }, true);

    $scope.requestRoommate = function() {
      //console.log("Sending request to " + $scope.requestUsername);
      Communicator.requestRoommate($scope.requestUsername, function(err, data) {
        if (!err && data) {
          console.log("Success!");
        }
        else {
          console.log("Error!");
        }
      });
    }

    $scope.acceptRoommate = function(cid) {
      //console.log("Accepting request from " + cid);
      Communicator.acceptRoommate(cid, function(err, data) {
        if (!err && data) {
          console.log("Success!");
        }
        else {
          console.log("Error!");
        }
      });
    }

    $scope.denyRoommate = function(cid) {
      //console.log("Denying request from " + cid);
      Communicator.denyRoommate(cid, function(err, data) {
        if (!err && data) {
          console.log("Success!");
        }
        else {
          console.log("Error!");
        }
      });
    }

    $scope.updateColleges = function() {
      //console.log($scope.colleges);
       Communicator.updateColleges($scope.colleges, function(err, data) {
        if (!err && data) {
          console.log("Success!");
        }
        else {
          console.log("Error!");
        }
      });

    }

    $scope.updateRooms = function() {
      //console.log($scope.rooms);
      Communicator.updateRooms($scope.rooms, function(err, data) {
        if (!err && data) {
          console.log("Success!");
        }
        else {
          console.log("Error!");
        }
      });
    }

  });

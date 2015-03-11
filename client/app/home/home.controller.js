'use strict';

angular.module('jRoomsApp')
  .controller('HomeCtrl', function ($scope, $location, State, Communicator) {
    $scope.user = {};
    $scope.profileImg = 'http://placehold.it/100x150';

  	// Redirect logged out users
  	$scope.$watch(State.loggedIn, function(val) {
  		if (!val) {
  			$location.path('/');
  		}
  	});

  	$scope.$watch(State.user, function(val) {
        if (val && val.username) {
          $scope.user = val;
          $scope.profileImg = Communicator.getProfileImage(val.username);
        }
        else {
          $scope.user = {};
        }
    }, true);
  });

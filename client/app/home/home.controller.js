'use strict';

angular.module('jRoomsApp')
  .controller('HomeCtrl', function ($scope, $location, State) {
    $scope.loggedIn = true;

  	// Redirect logged out users
  	$scope.$watch(State.loggedIn, function(val) {
  		$scope.loggedIn = val;

  		if (!val) {
  			$location.path('/');
  		}
  	});
  });

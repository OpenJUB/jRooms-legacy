'use strict';

angular.module('jRoomsApp')
  .controller('MainCtrl', function ($scope, $location, State) {
  	$scope.loggedIn = false;

  	// Redirect logged in users
  	$scope.$watch(State.loggedIn, function(val) {
  		$scope.loggedIn = val;

  		if (val) {
  			$location.path('/home');
  		}
  	});

  });

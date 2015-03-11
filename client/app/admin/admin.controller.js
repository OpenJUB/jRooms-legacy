'use strict';

angular.module('jRoomsApp')
  .controller('AdminCtrl', function ($scope, $location, State) {
  	// Redirect logged out users
  	$scope.$watch(State.loggedIn, function(val) {
  		if (!val) {
  			$location.path('/');
  		}
  	});
  });

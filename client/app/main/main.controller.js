'use strict';

angular.module('jRoomsApp')
  .controller('MainCtrl', function ($scope, $location, State) {
    $scope.alerts = [];
    $scope.loggedIn = false;

    $scope.$watch(State.loggedIn, function(val) {
        $scope.loggedIn = val;
    }, true);

  	$scope.login = function() {
  		State.login();
  	}

    $scope.dashboard = function() {
      $location.path('/home');
    }

  });

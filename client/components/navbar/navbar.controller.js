'use strict';

angular.module('jRoomsApp')
  .controller('NavbarCtrl', function ($scope, $location, State) {

    $scope.isCollapsed = true;
    $scope.state = State;

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
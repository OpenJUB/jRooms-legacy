'use strict';

angular.module('jRoomsApp')
  .controller('NavbarCtrl', function ($scope, $location, State) {
    
    $scope.isCollapsed = true;
    $scope.admin = { title: 'Admin', link: '/admin' };
    $scope.menu = [
    {
    	title: 'Home',
    	link: '/'
    },
    {
    	title: 'Issues?',
    	link: '/faq'
    },
    {
    	title: 'Results',
    	link: '/results'
    },
    {
    	title: 'About',
    	link: '/about'
    },
    ];

    $scope.loggedIn = false;
    $scope.user = {};
    $scope.isAdmin = false;

    $scope.$watch(State.loggedIn, function(val) {
        $scope.loggedIn = val;
    }, true);

    $scope.$watch(State.isAdmin, function(val) {
        $scope.isAdmin = val;
    }, true);

    $scope.$watch(State.user, function(val) {
        $scope.user = val;
    }, true);

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.login = function() {
        State.login();
    }

    $scope.logout = function() {
        State.logout();
    }
  });
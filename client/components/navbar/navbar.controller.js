'use strict';

angular.module('jRoomsApp')
  .controller('NavbarCtrl', function ($scope, $location, State) {
    $scope.menu = [
    {
    	title: 'Home',
    	link: '/',
        needsLogin: false,
        needsAdmin: false
    },
    {
        title: '<strong>Admin</strong>',
        link: '/admin',
        needsLogin: true,
        needsAdmin: true
    },
    {
    	title: 'Issues?',
    	link: '/faq',
        needsLogin: false,
        needsAdmin: false
    },
    {
    	title: 'Results',
    	link: '/results',
        needsLogin: false,
        needsAdmin: false
    },
    {
    	title: 'About',
    	link: '/about',
        needsLogin: false,
        needsAdmin: false
    },
    ];

    $scope.loggedIn = false;
    $scope.user = {};
    $scope.isAdmin = false;

    $scope.$watch(State.loggedIn, function(val) {
        $scope.loggedIn = val;

        if (val) {
            $scope.menu[0].link = '/home';
        }
        else {
            $scope.menu[0].link = '/';
        }
    }, true);

    $scope.$watch(State.isAdmin, function(val) {
        $scope.isAdmin = val;
    }, true);

    $scope.$watch(State.user, function(val) {
        $scope.user = val;
    }, true);

    $scope.shouldDisplay = function(item) {
        if (item.needsLogin && !$scope.loggedIn) return false;
        if (item.needsAdmin && !$scope.isAdmin) return false;
        return true;
    };

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
'use strict';

angular.module('jRoomsApp')
  .controller('NavbarCtrl', function ($scope, $state, $location, State) {
    $scope.menu = [
    {
    	title: 'Home',
    	link: '/',
        state: 'main'
    },
    {
        title: 'Dashboard',
        link: '/home',
        state: 'home'
    },
    {
        title: '<strong>Admin</strong>',
        link: '/admin',
        state: 'admin'
    },
    {
    	title: 'Issues?',
    	link: '/faq',
        state: 'faq'
    },
    {
    	title: 'Results',
    	link: '/results',
        state: 'results'
    },
    {
    	title: 'About',
    	link: '/about',
        state: 'about'
    }
    ];

    $scope.isCollapsed = true;
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

    $scope.shouldDisplay = function(item) {
        if ($state.get(item.state).data !== undefined 
        && $state.get(item.state).data.needsLogin
        && !$scope.loggedIn) 
            return false;

        if ($state.get(item.state).data !== undefined 
        && $state.get(item.state).data.needsAdmin
        && !$scope.isAdmin) 
            return false;

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
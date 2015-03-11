'use strict';

angular.module('jRoomsApp')
  .controller('NavbarCtrl', function ($scope, $location, State) {
    
    $scope.isCollapsed = true;
    $scope.state = State;
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

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
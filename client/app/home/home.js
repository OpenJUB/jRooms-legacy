'use strict';

angular.module('jRoomsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        templateUrl: 'app/home/home.html',
        controller: 'HomeCtrl',
        data: { needsLogin: true, needsAdmin: false }
      });
  });
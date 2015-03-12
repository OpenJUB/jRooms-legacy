'use strict';

angular.module('jRoomsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl',
        data: { needsLogin: false, needsAdmin: false }
      });
  });
'use strict';

angular.module('jRoomsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('results', {
        url: '/results',
        templateUrl: 'app/results/results.html',
        controller: 'ResultsCtrl',
        data: { needsLogin: false, needsAdmin: false }
      });
  });
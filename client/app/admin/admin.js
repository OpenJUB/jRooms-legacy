'use strict';

angular.module('jRoomsApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('admin', {
        url: '/admin',
        templateUrl: 'app/admin/admin.html',
        controller: 'AdminCtrl',
        data: { needsLogin: true, needsAdmin: true }
      });
  });
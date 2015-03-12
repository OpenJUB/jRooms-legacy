'use strict';

angular.module('jRoomsApp', [
  'ipCookie',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $compileProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
    $httpProvider.defaults.withCredentials = true;
    $compileProvider.aHrefSanitizationWhitelist(/^s*(https?|ftp|blob|mailto|chrome-extension|data):/);
  });
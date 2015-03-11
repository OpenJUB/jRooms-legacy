'use strict';

angular.module('jRoomsApp')
  .controller('MainCtrl', function ($scope, $location, State) {
    // Redirect logged in users
    if (State.loggedIn) {
      $location.path = '/home';
    }
  });

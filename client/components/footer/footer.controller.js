'use strict';

angular.module('jRoomsApp')
  .controller('FooterCtrl', function ($scope) {

    $scope.footerStrings = [
      'This footer kind of sucks...',
      'The average size of blue whale\'s penis is 2.4 to 3.0 meters.',
      'We weren\'t very creative with a footer.',
      'Coffee and allnighters!'
    ];
  
    $scope.getRandomString = function() {
      return _.sample($scope.footerStrings);
    }
  });

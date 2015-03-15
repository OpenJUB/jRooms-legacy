'use strict';

angular.module('jRoomsApp')
  .controller('FooterCtrl', function ($scope, $timeout) {
    $scope.footerStrings = [
      'This footer kind of sucks...',
      'We weren\'t very creative with a footer.',
      'Coffee and allnighters!',
      'Do you like ponies?',
      'Assisted by a brave trained team of flamingos.',
      'What is the meaning of life?',
      'So, how\'s the weather?',
      'Ja ja ja bitte genau.',
      'Check <a href="https://youtu.be/BROWqjuTM0g">this</a> out!'
    ];

    $scope.randomString = _.sample($scope.footerStrings);
  });

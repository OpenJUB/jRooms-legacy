'use strict';

angular.module('jRoomsApp')
  .controller('ResultsCtrl', function ($rootScope, $scope, Communicator) {
  	
  	$scope.results = [];

  	Communicator.allResults(function(err, data) {
  		if (!err && data) {
  			$scope.results = data;
  		}
  		else {
			$rootScope.showAlert({
		      type: 'danger',
		      msg: 'Oh oh! Server has returnted an error while loading results!'
		    });
  		}
  	});

  	$scope.exportResult = function(e, phase) {
  		e.preventDefault();
  		e.stopPropagation();

  		// what to do?
  	}
  });

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
		      msg: 'Oh oh! ' + err.error
		    });
  		}
  	});

  	$scope.exportResult = function(e, pid) {
  		e.preventDefault();
  		e.stopPropagation();

      location.href = '/api/phase/csv?id=' + pid;
  	}
  });

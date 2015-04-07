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
		      msg: 'Oh oh! Server has returned an error while loading results!'
		    });
  		}
  	});

  	$scope.exportResult = function(e, pid) {
  		e.preventDefault();
  		e.stopPropagation();

  		Communicator.exportPhase(pid, function(err, data) {
        if (!err && data) {
          $rootScope.showAlert({
              type: 'success',
              msg: 'Successfully exported!'
            });
        }
        else {
          $rootScope.showAlert({
              type: 'danger',
              msg: 'Oh oh! Server has returned an error while exporting results!'
            });
        }
      });
  	}
  });

'use strict';

angular.module('jRoomsApp')
  .controller('AdminCtrl', function ($scope, $location, State) {
  	$scope.nextPhaseId = 1;
    $scope.showImportSettings = false;
    $scope.importJSONString = '';

  	// Beware the bug! College phase needs to unset all the shit.
  	$scope.settings = {
  		isDatabaseReady : false,
  		tallPeople: '',
  		disabledRooms: '',
  		email: {
  			preference1: false,
  			preference2: false,
  			preference3: false,
  			preference4: false
  		},
  		phases: []
  	};

  	// Redirect logged out users
  	// $scope.$watch(State.loggedIn, function(val) {
  	// 	if (!val) {
  	// 		$location.path('/');
  	// 	}
  	// });

  	$scope.getSettings = function() {

  	};

  	$scope.setSettings = function() {

  	};

  	$scope.importUsers = function() {
  		$scope.settings.isDatabaseReady = true;
  	};

  	$scope.addPhase = function() {
  		$scope.settings.phases.push({
  			id: $scope.nextPhaseId++,
  			name: 'New phase',
  			from: '',
  			to: '',
  			filters: {
	  			enableCollegePhase: false,
	  			enableFilterTall: false,
          enableFilterColleges: false,
	  			enableFilterExchange: false,
          enableFilterPoints: false,
          enableFilterRooms: false,

          pointsMin: '',
          pointsMax: '',

          colleges: {
            krupp: false,
            mercator: false,
            nordmetall: false,
            c3: false
          },

          rooms: {
            one: false,
            two: false,
            three: false
          }
	  		}
  		});
  	}

    $scope.collegePhaseSelected = function(id) {
      var phase = _.find($scope.settings.phases, function(val) {
        if (val.id == id) return true;
      });

      if (phase.filters.enableCollegePhase) {
        phase.filters.enableFilterTall = false;
        phase.filters.enableFilterColleges = false;
        phase.filters.enableFilterExchange = false;
        phase.filters.enableFilterPoints = false;
        phase.filters.enableFilterRooms = false;
      }
    }

  	$scope.removePhase = function(id) {
      //if(window.confirm("Are you sure? You can't undo that...")) {
        $scope.settings.phases = _.reject($scope.settings.phases, function(val) {
          if (val.id == id) return true;
          return false;
        });
      //}
  	}

  	$scope.exportSettingsURL = function() {
      // Works in Firefox, Chrome, Opera.
      var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($scope.settings));
      return 'data:'+data;
    }

    $scope.importSettingsShow = function() {
  	  $scope.showImportSettings = true;
  	}

    $scope.importSettingsSubmit = function() {
      $scope.showImportSettings = false;

      var obj;
      try {
        obj = JSON.parse($scope.importJSONString);
        console.log(obj);
      }
      catch (syntaxError) {
        // error
        return;
      }

      // Validate a bit more?
      $scope.settings = obj;
      $scope.importJSONString = '';

      console.log($scope.settings.tallPeople);
    }

  	$scope.resetSystem = function() {

  	}
  });

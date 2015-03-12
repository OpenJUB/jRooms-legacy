'use strict';

angular.module('jRoomsApp')
  .controller('AdminCtrl', function ($scope, $location, State, Communicator) {
  	$scope.nextPhaseId = 1;
    $scope.showImportSettings = false;
    $scope.showEditUser = false;
    $scope.editUserString = '';
    $scope.editUser = {};
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


  	Communicator.currentSettings(function(err, settings) {
      if (!err && settings) {
        $scope.settings = settings;
      }
      else {
        console.log("Error: Current settings");
      }
    });

  	$scope.updateSettings = function() {
      Communicator.updateSettings($scope.settings, function(err, smth) {
        if (err) {
          console.log("Error: Update settings.");
        }
      });
  	};

  	$scope.importUsers = function() {
  	 Communicator.importUsers(function(err, settings) {
        if (!err && settings) {
          $scope.settings = settings;
        }
        else {
          console.log("Error: Importing users.");
        }
     });
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

    $scope.editUserToggle = function() {
      $scope.showEditUser = !$scope.showEditUser;

      if ($scope.showEditUser) {
        Communicator.getUser($scope.editUserString, function(err, user) {
          if (!err) {
            $scope.editUser = user;
          }
          else {
            console.log("Error: Edit user toggle.");
          }
        });
      }
    }

    $scope.editUserSubmit = function() {
      $scope.showEditUser = false;

      Communicator.setUser($scope.editUserString, $scope.editUser, function(err, smth) {
        if (!err) {
          console.log("Success!");
        }
        else {
          console.log("Error: Edit user submit.")
        }
      });
    }

  	$scope.exportSettingsURL = function() {
      // Works in Firefox, Chrome, Opera.
      var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($scope.settings));
      return 'data:'+data;
    }

    $scope.importSettingsToggle = function() {
  	  $scope.showImportSettings = !$scope.showImportSettings;
  	}

    $scope.importSettingsSubmit = function() {
      $scope.showImportSettings = false;

      var obj;
      try {
        obj = JSON.parse($scope.importJSONString);
        console.log(obj);
      }
      catch (syntaxError) {
        console.log("Error: Import settings JSON parsing.")
        return;
      }

      $scope.settings = obj;
      $scope.updateSettings();
      $scope.importJSONString = '';
    }

  	$scope.resetSystem = function() {

  	}
  });

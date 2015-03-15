'use strict';

angular.module('jRoomsApp')
  .controller('AdminCtrl', function ($scope, $location, State, Communicator) {
    $scope.alerts = [];
    $scope.pageReady = false;

  	$scope.nextPhaseId = 1;
    $scope.showImportSettings = false;
    $scope.showEditUser = false;
    $scope.editUserString = '';
    $scope.editUser = {};
    $scope.importJSONString = '';

  	$scope.settings = {
  		isDatabaseReady : false,
  		tallPeople: '',
  		disabledRooms: '',
      maxRooms: 7,
  		email: {
  			preference1: false,
  			preference2: false,
  			preference3: false,
  			preference4: false
  		},
  		phases: []
  	};

    $scope.$watch(State.user, function(val) {
      if (val) {
        if (val.isAdmin) {
          $scope.pageReady = true;
        }
        else {
          $scope.pageReady = false;
        }
      }
    })

  	Communicator.currentSettings(function(err, settings) {
      if (!err && settings) {
        $scope.settings = settings;

        if (settings.phases.length > 0) {
          $scope.nextPhaseId = _.max(settings.phases, function(phase) { return phase.id; }).id + 1;
        }
      }
      else {
        $scope.alerts.push({
          type: 'danger',
          msg: 'Oh oh! Server returned an error while requesting current settings!'
        });
      }
    });

  	$scope.updateSettings = function() {
      Communicator.updateSettings($scope.settings, function(err, smth) {
        if (!err) {
          $scope.alerts.push({
            type: 'success',
            msg: 'Successfully saved!'
          });
        } 
        else {
          $scope.alerts.push({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while saving the settings!'
          });
        }
      });
  	};

  	$scope.importUsers = function() {
  	 Communicator.importUsers(function(err, settings) {
        if (!err && settings) {
          $scope.settings = settings;
        }
        else {
          $scope.alerts.push({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while importing users!'
          });
        }
     });
    };

  	$scope.addPhase = function() {
  		$scope.settings.phases.push({
  			id: $scope.nextPhaseId,
  			name: 'New phase',
  			from: '',
  			to: '',
        isCollegePhase: false,
  			filters: {
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

      ++$scope.nextPhaseId;
  	}

    $scope.collegePhaseSelected = function(id) {
      var phase = _.find($scope.settings.phases, function(val) {
        if (val.id == id) return true;
      });

      if (phase.isCollegePhase) {
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
            $scope.alerts.push({
              type: 'danger',
              msg: 'Oh oh! Server returned an error while getting a user called "' + $scope.editUserString + '"!'
            });
          }
        });
      }
    }

    $scope.editUserSubmit = function() {
      Communicator.setUser($scope.editUserString, $scope.editUser, function(err, smth) {
        if (!err) {
          $scope.alerts.push({
            type: 'success',
            msg: 'Modifications to the user have been saved in the database!'
          });
        }
        else {
          $scope.alerts.push({
            type: 'danger',
            msg: 'Oh oh! Server returned an error while modifying the user "' + $scope.editUserString + '"!'
          });
        }

        $scope.showEditUser = false;
        $scope.editUserString = '';
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
        $scope.alerts.push({
          type: 'danger',
          msg: 'Oh oh! Got a syntax error, while trying to parse the JSON, that you provided! Please, be super careful with what you import here as it might corrupt the state of the entire server.'
        });
        return;
      }

      $scope.settings = obj;
      $scope.updateSettings();
      $scope.importJSONString = '';
    }

  	$scope.resetSystem = function() {
      $scope.alerts.push({
        type: 'danger',
        msg: 'I am not implemented yet!'
      });
  	}
  });

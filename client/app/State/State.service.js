'use strict';

angular.module('jRoomsApp')
  .service('State', function ($rootScope, $state, $location, ipCookie, Communicator) {
   var loggedIn = false;
   var isAdmin = false;
   var user = {};
   var currentPhase = {};

   return {
    loggedIn : function() {
      return loggedIn;
    },

    user: function() {
      return user;
    },

    isAdmin : function() {
      return isAdmin;
    },

    updateUser : function(fn) { 
     if (ipCookie('token')) {
      Communicator.getCurrentUser(function(err, data) {
        if (!err && data) {
          loggedIn = true;
          isAdmin = data.isAdmin;
          user = data;

          fn ( true, user );
        }
      });
     }
     else {
      fn( false , null )
     }
    },

    currentPhase : function() {
      return currentPhase;
    },

    login : function() {
      window.addEventListener('message', function(e) {
        if (e.origin !== Communicator.openJUB) return;
        var edata = JSON.parse(e.data);

        if (edata && edata.token) {
          ipCookie('token', edata.token, { expires: 2, path: '/' });
          
          Communicator.getCurrentUser(function(err, data) {
            if (!err && data) {
              loggedIn = true;
              isAdmin = data.isAdmin;
              user = data;

              $location.path('/home');
            }
            else {
              $rootScope.showAlert({ 
                type: 'danger', 
                msg: 'Oh oh! ' + err.error 
              });
            }
          });
        }
      });

      window.open('https://api.jacobs-cs.club/view/login', '_blank', 'width=500, height=500, resizeable=0, toolbar=0, scrollbar=0, location=0');
   },

   logout : function() {
    ipCookie.remove('token');

    loggedIn = false;
    isAdmin = false;
    user = {};

    // Check for login
    if ($state.current.data !== undefined
      && $state.current.data.needsLogin
      && !loggedIn) {
      $location.path('/');
    }

    // Check for admin
    if ($state.current.data !== undefined
      && $state.current.data.needsAdmin
      && !isAdmin) {
      $location.path('/');
    }
   }
  };
});

'use strict';

angular.module('jRoomsApp')
  .service('State', function ($cookieStore, Communicator) {
   var openJUB = 'https://api.jacobs-cs.club';

   var loggedIn = false;
   var isAdmin = false;
   var user = {};
   var currentPhase = {};

   if ($cookieStore.get('token')) {
    Communicator.getCurrentUser(function(err, data) {
      if (err == null && data != null) {
        loggedIn = true;
        isAdmin = data.isAdmin;
        user = data;
      }
    });
   }

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

    currentPhase : function() {
      return currentPhase;
    },

    login : function() {
      window.addEventListener('message', function(e) {
        if (e.origin !== openJUB) return;
        var data = JSON.parse(e.data);

        if (data && data.token) {
          Communicator.getCurrentUser(function(err, data) {
            if (err == null && data != null) {
              $cookieStore.put('token', data.token);
              
              loggedIn = true;
              isAdmin = data.isAdmin;
              user = data;
            }
          });
        }
        else {
          logout();
        }
      });

      window.open('https://api.jacobs-cs.club/view/login', '_blank', 'width=500, height=500, resizeable=0, toolbar=0, scrollbar=0, location=0');
   },

   logout : function() {
    loggedIn = false;
    isAdmin = false;
    user = {};

    $cookieStore.remove('token');
   }
  };
});

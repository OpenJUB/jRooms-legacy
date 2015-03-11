'use strict';

angular.module('jRoomsApp')
  .service('State', function (ipCookie, Communicator) {
   var loggedIn = false;
   var isAdmin = false;
   var user = {};
   var currentPhase = {};

   if (ipCookie('token')) {
    Communicator.getCurrentUser(function(err, data) {
      if (!err && data) {
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
        if (e.origin !== Communicator.openJUB) return;
        var edata = JSON.parse(e.data);

        if (edata && edata.token) {
          Communicator.getCurrentUser(function(err, data) {
            if (!err && data != null) {
              ipCookie('token', edata.token, { expires: 2, path: '/' });
              
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

    ipCookie.remove('token');
   }
  };
});

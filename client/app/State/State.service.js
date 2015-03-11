'use strict';

angular.module('jRoomsApp')
  .service('State', function ($cookies, Communicator) {
   this.openJUB = 'https://api.jacobs-cs.club';

   this.loggedIn = false;
   this.isAdmin = false;
   this.user = null;
   this.currentPhase = null;

   if ($cookies.token) {
    Communicator.getCurrentUser(function(err, data) {
      if (err == null && data != null) {
        this.user = data;
      }
    });
   }

   this.login = function() {
    console.log($cookies);

   	window.addEventListener('message', function(e) {
	    if (e.origin !== this.openJUB) return;
			var data = JSON.parse(e.data);

			if (data && data.token) {
        this.loggedIn = true;
        $cookies.token = data.token;
      
        Communicator.getCurrentUser(function(err, data) {
          if (err == null && data != null) {
            this.user = data;
          }
        });
			}
			else {
				this.logout();
			}
		});

    window.open('https://api.jacobs-cs.club/view/login', '_blank', 'width=500, height=500, resizeable=0, toolbar=0, scrollbar=0, location=0');
   }

   this.logout = function() {
   	this.loggedIn = false;
   	this.isAdmin = false;
   	this.user = null;

   	$cookies.token = null;
   }
});

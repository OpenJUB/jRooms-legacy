Install
=======

Clone
-----
    git clone https://github.com/OpenJUB/jRooms.git
    cd jRooms
    
Download dependencies
---------------------
Install NodeJS, npm and MongoDB using your favorite package manager. 

On Windows? I'm sorry.

    npm install -g grunt grunt-cli bower
    npm install
    bower install

Doesn't work for some reason? Try following [this method](http://stackoverflow.com/a/20765400).

Run!
----
    mongod --dbPath /path/to/db
    grunt serve
    
Build: `grunt build`

Production: `grunt serve:dist`


What now?
----
- Add yourself to the admins in config file.
- Login and navigate to /admin.
- Import data and configure to your taste.

# ringo-sunserver

This is a lightweight JSGI server using the HTTP server available in 
Sun's (Oracle's) JRE. By adjusting Java's Xmx settings and running in
interpreted mode (with JIT turned off), it should be possible to use
less than 12MB of RAM per RingoJS process using this server.

To run standalone:

    ringo sunserver.js myjsgiwebapp.js
    
To embed:

    require('sunserver').run(exports.app, 8080);

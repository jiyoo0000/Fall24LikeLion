const express = require('express');
const router = express.Router();

//set to store all connections
let connections = new Set();
let classes = {};
router.ws('/', function (ws, req) {

    //on error, log the error
    ws.on('error', console.error);

    //log the new connection
    console.log("New connection has opened!");

    //get the user_id and name from the query params
    ws.user_id = req.query.user_id;
    ws.name = req.query.name;
    ws.userClasses = req.query.userClasses.split(',')

    //add to the active connection set
    connections.add(ws);

    ws.userClasses.forEach((className) => {
        if (classes[className] == null) {
            classes[className] = new Set()
        }
        classes[className].add(ws)
        console.log('added to class: ' + className)
    });

    //on close, log the close event
    ws.on('close', function() {
        console.log('The connection was closed!');
        connections.delete(ws);
    });

    //on message, log the message and send it back to the all the active connections
    ws.on('message', function (msg) {
        //ws.send(msg + ' received from ' + name);
        let parseMsg = JSON.parse(msg)
        console.log('received: %s from %s', parseMsg.message, ws.name);
        broadcastToClass(ws.name + " sent to " + parseMsg.course +
            ": " + parseMsg.message + "\n", parseMsg.course);

    });

});

//broadcast function to send message to all active connections
const broadcast = (msg) => {
    //loop through all the active connections
    connections.forEach((ws)=>{
        //if the connections are objects with info use something like ws.ws.send()
        ws.send(msg);
    })
}

const broadcastToClass = (msg, className) => {
    if (!classes[className]) {
        console.error(`Class ${className} does not exist`);
        return;
    }

    classes[className].forEach((ws) => {
        console.log('sending to user:' + ws.name)
        ws.send(JSON.stringify(
            {
                message: msg,
                course: className
            }
        ));
    })
}
module.exports = router;
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const router = express.Router();

const mongoConfig = require('./mongoConfig.json');
const uri = mongoConfig.uri;

// 몽고 연결 펑션
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");
        return client.db("Fall24LikeLion");
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}

// 몽고 연결 펑션


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
    // 추가해준거는 className을 받아서 몽고디비에있는 그 클레스 네임에 메시지를 저장하는 로직
    ws.on('message', async function (msg) {
        //ws.send(msg + ' received from ' + name);
        let parseMsg = JSON.parse(msg)
        let currentDate = new Date();
        console.log('received: %s from %s at %s', parseMsg.message, ws.name, currentDate);
        let className = parseMsg.course;
        console.log(className);
         try{
                const db = await connectToMongo();
                const coursesCollection = db.collection('course');

                const courseUpdateResult = await coursesCollection.updateOne(
                    { course_name: className }, // Assuming you identify courses by 'courseName'
                    {
                        $addToSet: {
                            chatroom: {
                                sent_at: currentDate,
                                sent_msg: parseMsg.message,
                                sent_uid: ws.user_id
                            }
                        }
                    }
                );
                console.log('Message stored in MongoDB:', courseUpdateResult);
            }
            catch (error) {
                console.error("Error Storing Messeage", error);
            }



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
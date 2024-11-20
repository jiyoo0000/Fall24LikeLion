var express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var router = express.Router();
let mongoConfig;
try {
    mongoConfig = require('./mongoConfig.json');
} catch (error) {
    console.error('Failed to load mongoConfig.json:', error);
    mongoConfig = { uri: process.env.MONGO_URI };
}
finally {
    console.log('mongoConfig successfully loaded');
}
const uri = mongoConfig.uri;

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

router.get('/chatlog', async (req, res) => {
    const { courseID } = req.query;

    if (!courseID) {
        return res.status(400).send('CourseID parameter is required.');
    }

    try {
        const db = await connectToMongo();
        const collection = db.collection('course');

        const chatLog = await collection
            .findOne({ _id: new ObjectId(courseID) });

        res.status(200).send(chatLog.chatroom);
    } catch (error) {
        console.error('Error fetching chatroom:', error);
        res.status(500).send('Internal server error.');
    }


});

module.exports = router;

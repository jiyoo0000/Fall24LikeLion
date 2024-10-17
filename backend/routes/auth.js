const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser'); // To parse incoming request bodies
const cors = require('cors');
const router = express.Router();

const mongoConfig = require('./mongoConfig.json');

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

// Create a route to store the user UID
router.post('/signup', async (req, res) => {
    const { uid, email } = req.body; // Assuming `uid` and `email` are sent from frontend


    if (!uid || !email) {
        return res.status(400).send('Invalid request: UID and email are required.');
    }

    try {
        const db = await connectToMongo();
        const collection = db.collection('users'); // Create or use 'users' collection
        const result = await collection.insertOne({ uid, email }); // Store uid and email
        res.status(201).send({ message: 'User stored successfully', userId: result.insertedId });
    } catch (error) {
        console.error('Error storing user UID:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
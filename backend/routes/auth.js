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
/*
example

{
  "uid": "R2lQRFIwa3RJMgJUawGvYGmNM163",
  "email" : "bbeat2782@gmail.com",
  "id" : ["course1", "course2", "course3", "course4"]
}

response

{
  "message": "Course IDs for user bbeat2782@gmail.com",
  "ids": ["course1", "course2", "course3", "course4"]
}

*/ 
router.get('/login', async (req, res) => {

    // users Schema
    const UserSchema = new mongoose.Schema({
        uid: String,
        email: String,
        id: [String]
    });

    const User = mongoose.model('User', UserSchema);
    const Course = mongoose.model('Course', CourseSchema);


    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Invalid request: email are required.');
    }

    try{
        const user = await User.findOne({ email })

        // If there is no user's email
        if(!user){
            return res.status(404).send('User not found');
        }

        // response course id array
        return res.status(200).json({
            message: `Course IDs for user ${email}`,
            ids: user.id
          });

        
    }catch{ // error dectector
        console.error('Error while fetching user:', error);
        return res.status(500).send('Internal server error');
    }

})



module.exports = router;
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
        const result = await collection.updateOne(
            { _id: uid },
            { $setOnInsert: { _id: uid, email: email, name: "", courses:[] } },
            { upsert: true }); // Store uid and email
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
  "course_id" : ["course1", "course2", "course3", "course4"]
}

response

{
  "message": "Course IDs for user bbeat2782@gmail.com",
  "course_id": ["course1", "course2", "course3", "course4"].
}


const UserSchema = new mongoose.Schema({
        uid: String,
        email: String,
        course_id: [String]
    });

    const User = mongoose.model('User', UserSchema);

    const user = await User.findOne({ email })
*/ 
router.get('/login', async (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Invalid request: email are required.');
    }

    try{
        const db = await connectToMongo();
        const collection = db.collection('users'); // Direct access to collection without a schema
        const user = await collection.findOne({ email });

        // If there is no user's email
        if(!user){
            return res.status(404).send('User not found');
        }

        // response course id array
        return res.status(200).json({
            message: `Course IDs for user ${email}`,
            courses: user.courses,
            chatroom: user.chatroom || {}
          });

        
    }catch{ // error dectector
        console.error('Error while fetching user:', error);
        return res.status(500).send('Internal server error');
    }

})

router.put('/login', async (req, res) => {
    const {uid, name} = req.body;

    if (!uid || !name) {
        return res.status(400).send('Invalid request: UID and name are required.');
    }
    
    try{
        // connecting to Mongo
        const db = await connectToMongo();
        const collection = db.collection('users');

        //Update user's name based on uid
        const result = await collection.updateOne(
            { _id: uid },  // Match user by uid
            { $set: { name: name } }  // Update the name field
        );

        res.status(200).send({ message: 'User name updated', name: name});
    }catch(error){
        console.error('Error occurs', error);
        res.status(500).send('internal server error');
    }
});
module.exports = router;
var express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var router = express.Router();

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

router.get('/', async (req, res) => {
  const { course } = req.body; 

  if (!course) {
      return res.status(400).send('Course query parameter is required.');
  }

  try {
      const db = await connectToMongo();
      const collection = db.collection('course');

      // Search for courses with names starting with the given string (case-insensitive)
      const regex = new RegExp(`^${course}`, 'i');
      const results = await collection
        .find({ course_name: { $regex: regex } })
        .project({ _id: 1, course_name: 1 })
        .toArray();

      if (results.length === 0) {
          return res.status(204).send('No matching courses found.');
      }

      res.status(200).send(results);
  } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).send('Internal server error.');
  }
});


router.get('/enrolled', async (req, res) => {
    const { uid } = req.body;

    if (!uid) {
        return res.status(400).send('Uid query parameter is required.');
    }

    try{
        const db = await connectToMongo();
        // For getting enrolled courses for a given user
        const collection = db.collection('users');
        // For getting course_name
        const coursesCollection = db.collection('course');

        // Find the user document with the given uid
        const user = await collection.findOne({ _id: uid });

        // Check if the user exists
        if (!user) {
            return res.status(404).send('User not found.');
        }

        // Extract the courses field from the user document
        const courseIds = user.courses || [];
        const objectIds = courseIds.map(id => ObjectId.createFromHexString(id));

        // Find the courses that match the provided IDs
        const courses = await coursesCollection
            .find({ _id: { $in: objectIds } })
            .project({ _id: 1, course_name: 1 })
            .toArray();

        if (courses.length === 0) {
            return res.status(204).send('No courses found.');
        }

        return res.status(200).json(courses);
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while fetching the enrolled courses.');
    }
});


router.put('/enroll', async (req, res) => {
    const { uid, courseId } = req.body;

    if (!uid || !courseId) {
        return res.status(400).send('Both uid and course_id are required.');
    }

    try {
        const db = await connectToMongo();
        const usersCollection = db.collection('users');
        const coursesCollection = db.collection('course');

        // Update the user's courses array to include the course_id
        const userUpdateResult = await usersCollection.updateOne(
            { _id: uid },
            { $addToSet: { courses: courseId } }
        );

        // Update the course's users array to include the uid
        courseObjectId = ObjectId.createFromHexString(courseId);
        const courseUpdateResult = await coursesCollection.updateOne(
            { _id: courseObjectId },
            { $addToSet: { users: uid } }
        );

        // Check if both updates were successful
        // TODO might need to handle this differently (diff message for diff case)
        if (userUpdateResult.modifiedCount === 0 || courseUpdateResult.modifiedCount === 0) {
            return res.status(404).send('User or course not found, or already enrolled.');
        }

        return res.status(200).send('User successfully enrolled in the course.');
        
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while enrolling a course');
    }
})


router.delete('/', async (req, res) => {
    const { uid, courseId } = req.body;

    if (!uid || !courseId) {
        return res.status(400).send('Both uid and course_id are required.');
    }

    try {
        const db = await connectToMongo();
        const usersCollection = db.collection('users');
        const coursesCollection = db.collection('course');

        // Update the user's courses array to exclude the course_id
        const userUpdateResult = await usersCollection.updateOne(
            { _id: uid },
            { $pull: { courses: courseId } }
        );

        // Update the course's users array to exclude the uid
        courseObjectId = ObjectId.createFromHexString(courseId);
        const courseUpdateResult = await coursesCollection.updateOne(
            { _id: courseObjectId },
            { $pull: { users: uid } }
        );


        // Check if both updates were successful
        // TODO might need to handle this differently (diff message for diff case)
        if (userUpdateResult.modifiedCount === 0 || courseUpdateResult.modifiedCount === 0) {
            return res.status(404).send('User or course not found, or already dropped.');
        }


        return res.status(200).send('User successfully dropped in the course');
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while dropping a course');
    }
});

module.exports = router;

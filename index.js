const serviceAccount = require("./minder-alert-firebase-adminsdk-ucw60-12ee8b5205.json");
const { getMessaging } = require('firebase-admin/messaging');   
const schedule = require('node-schedule');
const admin = require('firebase-admin');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const PORT = 3000;


const app = express();
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
}));

// Set Content-Type header
app.use(function (req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  next();
});



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Handle POST requests to /send
app.post('/send', async function (req, res) {
  try {
    const title = req.body.title;
    const body = req.body.body;
    const receivedToken = "dX2ttUPzR_W-1zTpL_i1w7:APA91bE2LInMj9LfEK6uYmroS92S-ARY7Ajzs_yV0JXscnFVgb-LMRiwGmk2vmdZnTe2QpZsaCl3PNPKSkhwpaqY_UGwkNXqT2PNKvtVNEhKB7VocIH4qvoFK8_IdRhBYyM0nBXeN9Wa";
    console.log('receivedToken', receivedToken);
    
    if (!receivedToken) {
      return res.status(400).json({
        error: 'Invalid request. Missing FCM token.',
      });
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: receivedToken,
    };

    const response = await getMessaging().send(message);

    console.log('Successfully sent message:', response);

    res.status(200).json({
      message: 'Successfully sent message',
      token: receivedToken,
    });
  } catch (error) {
    console.error('Error sending message:', error);

    res.status(500).json({
      error: error.message,
    });
  }
});


const scheduledJob = schedule.scheduleJob('* * * * *', async () => {

console.log('Running scheduled job');
  // You can make an HTTP request to your API endpoint here
  try {
    const response = await axios.post('http://localhost:3000/send', {
      title: 'Test Notification',
      body: 'This is a Test Notification',
    });
    console.log('Successfully called API:', response.data);
  } catch (error) {
    console.error('Error calling API:', error.message);
  }
});



// Start the server
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});

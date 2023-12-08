import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import express from 'express';
import cors from 'cors';

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

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
  projectId: 'minder-alert',
});

// Handle POST requests to /send
app.post('/send', async function (req, res) {
  try {
    const receivedToken = "dX2ttUPzR_W-1zTpL_i1w7:APA91bE2LInMj9LfEK6uYmroS92S-ARY7Ajzs_yV0JXscnFVgb-LMRiwGmk2vmdZnTe2QpZsaCl3PNPKSkhwpaqY_UGwkNXqT2PNKvtVNEhKB7VocIH4qvoFK8_IdRhBYyM0nBXeN9Wa";
    console.log('receivedToken', receivedToken);
    
    if (!receivedToken) {
      return res.status(400).json({
        error: 'Invalid request. Missing FCM token.',
      });
    }

    const message = {
      notification: {
        title: 'Notif',
        body: 'This is a Test Notification',
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
      error: 'Internal Server Error',
    });
  }
});


const interval = 10 * 1000; // 60 seconds * 1000 milliseconds
setInterval(async () => {
  try {
    // Assuming your server is running on localhost:3000
    const apiUrl = 'http://localhost:3000/send';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Additional request parameters if needed...
    });

    const result = await response.json();
    console.log('API Response:', result);
  } catch (error) {
    console.error('Error calling API:', error);
  }
}, interval);


// Start the server
const PORT = 3000;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});

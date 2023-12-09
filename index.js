const serviceAccount = require("./minder-alert-firebase-adminsdk-ucw60-12ee8b5205.json");
const { getMessaging } = require("firebase-admin/messaging");
const { Firestore } = require("@google-cloud/firestore");
const schedule = require("node-schedule");
const moment = require('moment-timezone');
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

const firestore = new Firestore({
  projectId: "minder-alert",
  keyFilename: "./minder-alert-firebase-adminsdk-ucw60-12ee8b5205.json",
});

app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

// Set Content-Type header
app.use(function (req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const scheduledJob = schedule.scheduleJob('*/10 * * * * *', async () => {
  console.log("Running scheduled job");

  try {
    const currentTime = new Date();
    const formattedTime = moment(currentTime).tz('Asia/Karachi').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

    const users = await getUsersData();

    // process appointments for each user
    await Promise.all(users.map(async (user) => {
      const appointments = await getAppointment(user.uid, false, formattedTime);

      appointments.forEach(async (appointment) => {
        const appointmentTime = moment(appointment.data.appointmentDateTime.toDate())
        .tz('Asia/Karachi')
        .toDate();
      
      const timeThreshold = 1 * 60 * 1000; 
      
      if (Math.abs(currentTime - appointmentTime) < timeThreshold) {
          const title = 'Appointment Reminder';
          const body = `Your appointment with ${appointment.data.doctorName} is scheduled at ${appointmentTime}`;
          const message = {
            notification: {
              title: title,
              body: body,
            },
            token: user.fcm,
            android: {
              notification: {
                sound: 'default',
              },
              priority: 'high',
            },
          };
          const response = await getMessaging().send(message);
          console.log("Successfully sent message:", response);
        } else {
          console.log(`Not sending notification for user ${user.uid}. Appointment time not reached.`);
        }
      });


      // process medication schedules for each user
      const medSchedules = await getMedSchedules(user.uid, false, formattedTime);
      medSchedules.forEach(async (medSchedule) => {
        const medName = medSchedule.data.medName.toString();
        const scheduledTime = moment(medSchedule.data.time.toDate())
        .tz('Asia/Karachi')
        .toDate();
        const timeThreshold = 1 * 60 * 1000; 

        if (Math.abs(currentTime - scheduledTime) < timeThreshold) {
          const title = 'Medication Reminder';
          const body = `It's time to take your ${medName}`;
          const message = {
            notification: {
              title: title,
              body: body,
            },
            token: user.fcm,
          };
          const response = await getMessaging().send(message);
          console.log("Successfully sent message:", response);
        } else {
          console.log(`Not sending notification for user ${user.uid}. Medication time not reached.`);
        }
      });
    }));
  } catch (error) {
    console.error("Error:", error.message);
  }
});


const collectionNameMed = "medSchedule";

async function getMedSchedules( uid, status, time) {
  try {
    const dateObject = new Date(time);
    const currenttime = admin.firestore.Timestamp.fromDate(dateObject);
    const collectionRef = firestore.collection(collectionNameMed).where("uid", "==", uid).where("status", "==", status).where("time", "<=", currenttime);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log("No documents found in the collection.");
      return [];
    }

    const medSchedules = [];
    snapshot.forEach((doc) => {
      medSchedules.push({
        id: doc.id,
        data: doc.data(),
      });
    });

    return medSchedules;
  } catch (error) {
    console.error("Error getting documents from collection:", error);
    throw error;
  }
}


const collectionNameAppoinment = "appointments";

async function getAppointment(uid, status, time) {
  try {
    const dateObject = new Date(time);
    const currenttime = admin.firestore.Timestamp.fromDate(dateObject);
    const collectionRef = firestore.collection(collectionNameAppoinment).where("uid", "==", uid).where("status", "==", status).where("appointmentDateTime", "<=", currenttime);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log("No documents found in the collection.");
      return [];
    }

    const appointment = [];
    snapshot.forEach((doc) => {
      appointment.push({
        id: doc.id,
        data: doc.data(),
      });
    });

    return appointment;
  } catch (error) {
    console.error("Error getting documents from collection:", error);
    throw error;
  }
}


const collectionNameUser = 'users';

async function getUsersData() {
  try {
    const collectionRef = firestore.collection(collectionNameUser);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log('No documents found in the collection.');
      return [];
    }

    const usersList = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      // Assuming 'fcmToken' and 'uid' are fields in your user documents
      const { fcm, uid } = userData;
      
      if (fcm && uid) {
        usersList.push({ fcm, uid });
      }
    });
    // console.log('usersList', usersList);
    return usersList;
  } catch (error) {
    console.error('Error getting documents from collection:', error);
    throw error;
  }
}

// Start the server
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});

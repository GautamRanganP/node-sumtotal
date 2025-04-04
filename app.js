const bodyParser = require('body-parser')
const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
require('dotenv').config();
const cors = require('cors');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

// const allowedOrigins = [
//     process.env.STAGE_URL,
//     process.env.PRODUCTION_URL
//   ];
   
//   const corsOptions = {
//       origin: function (origin, callback) {
//           if (!origin || allowedOrigins.includes(origin)) {
//               callback(null, true);
//           } else {
//               callback(new Error("Not allowed by CORS"));
//           }
//       }
//   };
   
const corsOptions = {
  origin: '*', // Allow all origins
};
  app.use(cors(corsOptions));

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  }),
  databaseURL: 'https://sumtotal-backend.firebaseio.com'
});
const db = admin.firestore();
const docRef = db.collection("activities").doc("trainingrecords");
let accessToken = null; // Store the token in memory
// Endpoint to authenticate using client credentials
app.post('/auth/client-credentials', async (req, res) => {
  try {
    // Make a request to the token endpoint
    const response = await axios.post(
      process.env.TOKEN_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token
    // Send the access token to the client
    res.status(200).send({ accessToken: response.data.access_token });
  } catch (error) {
    console.error('Error authenticating with client credentials:', error);
    res.status(500).send({ error: 'Failed to authenticate using client credentials' });
  }
});

app.get('/welcome', async (req, res) => {
  
    res.status(200).send("welcome to Server");
})

app.get('/', async (req, res) => {
  try {
    let data = {} ;
    let json = await docRef.get()
    if(json.exists){
      data = json.data()
    }
    res.status(200).send(data);
  }
  catch (error) {
    res.status(500).send({ error: 'Failed to access external API' });
  }
    // res.status(200).send("welcome to Server");
})
app.get('/getactivities', async (req, res) => {

  try {
    let data = {} ;
    let json = await docRef.get()
    if(json.exists){
      data = json.data()
    }
    res.status(200).send(data);
  }
  catch (error) {
    res.status(500).send({ error: 'Failed to access external API' });
  }
})

  app.get('/updateactivities', async (req, res) => {
    console.log("token:",accessToken)
    // Calculate start and end dates dynamically

  const startDate = "2025-01-01T00:00:00.000Z"
  const endDate   = "2025-12-28T00:00:00.000Z"
    // const { startDate, endDate } = calculateDates(currentDate);

    let payload = {
      startDate: startDate,
      endDate: endDate,
    };
    try {
      if (!accessToken) {
        return res.status(401).send({ error: 'Access token not available. Authenticate first.' });
      }
      const response = await fetch('https://hexaware.sumtotal.host/apis/api/v2/activities?limit=100',  {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();

      // replaceDocument(json);
      res.status(200).send(json);
      
      } catch (error) {
      console.error(error.message);
      res.status(500).send({ error: 'Failed to access external API' });
      }
  });
 
// async function replaceDocument(data) {
//     try {
//         await docRef.delete();
//         console.log("Document successfully deleted");
//         await docRef.set(data);
//         console.log("Document successfully recreated with new data");
//     } catch (error) {
//         console.error("Error processing document:", error);
//     }
// }

// const currentDate = new Date();
// function getLastDayOfMonth(year, month) {
//     return new Date(year, month + 1, 0); // Month + 1, day 0 gives the last day of the month
// }

// function calculateDates(currentDate) {
//     const year = currentDate.getFullYear();
//     const currentMonth = currentDate.getMonth();
//     const midDate = new Date(year, currentMonth, 15); // Mid-date of the current month

//     let startDate = new Date(year, currentMonth, 1); // Start of the current month
//     let endDate;

//     if (currentDate < midDate) {
//         // If before mid-date, end date is the last day of the current month
//         endDate = getLastDayOfMonth(year, currentMonth);
//     } else {
//         // If mid-date or later, end date is the last day of the next month
//         endDate = getLastDayOfMonth(year, currentMonth + 1);
//     }

//     return { startDate, endDate };
// }
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});


module.exports = app;
// backend/app.js

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open'); // get rid of this shit later npm

const express = require('express');
const cors = require('cors');
const {google} = require('googleapis');
const gmail = google.gmail('v1');

const mongo = require('mongodb').MongoClient;
const base64url = require('base64url');
const { convert } = require('html-to-text');
const { findTracking } = require('ts-tracking-number');
const tracker = require('delivery-tracker');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000']
}));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!!" });
});

// MongoDB stuff

// const mongoPath = path.join(__dirname, 'mongodb.keys.json');
// if (fs.existsSync(mongoPath)) {
//   connectionString = require(mongoPath).connection_string;
// }

// mongo.connect(connectionString)
//   .then(client => {
//     console.log("Connected to DB")
//     const db = client.db('PackageTracker')
//     const emails = db.collection('emails')
//     emails.insertOne({"test": "bob"})
//       .then(result => {
//         console.log(result)
//       })
//       .catch(error => console.error(error))
//   })
//   .catch(error => console.error(err))

// Google API

/**
 * To use OAuth2 authentication, we need access to a a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
const keyPath = path.join(__dirname, 'oauth2.keys.json');
// let keys = {redirect_uris: ['']};
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

/**
 * Create a new OAuth2 client with the configured keys.
 */
const oauth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0]
);

/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
google.options({auth: oauth2Client});

/**
 * Returns auth url to frontend
 */
app.get("/oauth2", (req, res) => {
  // res.json({ message: "Hello!"} );
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes.join(' '),
  });
  // console.log(authorizeUrl);
  res.redirect(authorizeUrl);
})

app.get('/oauth2callback', async (req, res) => {
  // acquire the code from the querystring, and close the web server.
  // res.end('Authentication successful! Please return to the console.');
  const qs = new url.URL(req.url, 'http://localhost:3001').searchParams;
  // console.log(qs);
  const {tokens} = await oauth2Client.getToken(qs.get('code'));
  // console.log(tokens);
  oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
  runSample();
  res.send("<script>window.opener.location.href='http://localhost:3000/products';window.close();</script>");
})

/**
 * Returns a list of thread IDs of all emails related to packages between today and a specified time in the past
 * @param {number} maxDaysAgo 
 * @returns {Promise} Promise represents array of email thread IDs
 */
async function getThreadIds(maxDaysAgo=90) {
  // Set the range of dates (X days ago - tomorrow, in order to include today)
  const today = new Date()
  const tomorrow = new Date(today - 24*3600*1000).toLocaleDateString("en-US")
  const certainDaysAgo = new Date(today - maxDaysAgo*24*3600*1000).toLocaleDateString("en-US")

  // Set query string
  const queryString = `package OR shipping OR tracking after:${certainDaysAgo} before:${tomorrow} -return`

  // Request threads and extract threadIds
  var res = await gmail.users.threads.list({
    userId: 'me',
    q: queryString
  });
  var threadIds = res.data.threads.map(_ => _.id)

  // If the response returns a nextPageToken, loop through until all threadIds have been extracted
  while (res.data.nextPageToken) {
    res = await gmail.users.threads.list({
      userId: 'me',
      q: queryString,
      pageToken: res.data.nextPageToken
    });
    threadIds.push(...res.data.threads.map(_ => _.id))
  }

  return threadIds
}

/**
 * Returns the contents, sender, and timestamp of an email
 * @param {string} threadId 
 * @returns {Array} Array of email contents, sender, and the timestamp
 */
async function getThreadInfo(threadId) {
  const resFull = await gmail.users.messages.get({
    userId: 'me',
    id: threadId,
    format: 'full'
  });
  const resRaw = await gmail.users.messages.get({
    userId: 'me',
    id: threadId,
    format: 'raw'
  });
  const senders = resFull.data.payload.headers.filter(_ => _.name.toLowerCase() === 'from').map(_ => _.value)
  const sender = senders.length > 0 ? senders[0] : 'Unknown sender'

  const rawText = convert(base64url.decode(resRaw.data.raw));
  // if (threadId === '179f7f8f8f8a2210') {
  //   console.log(rawText)
  // }
  return [rawText, sender, resRaw.data.internalDate]
}

const couriers = {
  'dhl' : tracker.courier(tracker.COURIER.DHL.CODE),
  'fedex' : tracker.courier(tracker.COURIER.FEDEX.CODE),
  'ups' : tracker.courier(tracker.COURIER.UPS.CODE),
  'usps' : tracker.courier(tracker.COURIER.USPS.CODE)
}

async function getTrackingInfo(text) {
  // Get list of potential tracking numbers and carriers
  const trackingNumbers = findTracking(text)
  if (trackingNumbers.length === 0) console.log('Skipping since empty')

  // Loop through the list and see if any tracking numbers work
  for (const entry of trackingNumbers) {
    // Check that carrier is supported
    if (entry.courier.code in couriers) {
      const courier = couriers[entry.courier.code]
      courier.trace(entry.trackingNumber, function (err, result) {
        if (err) {
          console.error(err)
          return // What should be returned? Probably throw an error and return
        }
        // No error, so continue
        console.log(result.courier.name + ',' + result.status + ',' + result.number + ',' + result.checkpoints) // undefined or not found in DB if no package found (older than 120 days)
      })
    } else {
      // Something about how carrier isn't supported
    }

    // Currently doesn't get Amazon packages?

    // What if there are multiple that return positive response?

    // If delivered, check if package delivered within reasonable time period of timestamp of email (eg, 90 days)
    // May be completely wrong package
  }

}

async function runSample() {
  // const res = await gmail.users.getProfile({userId: 'me'});
  // console.log(res.data.emailAddress);

  const threadIds = await getThreadIds()
  var threads = []

  for (const id of threadIds) {
    let rawText, rest;
    [rawText, ...rest] = await getThreadInfo(id)
    getTrackingInfo(rawText)
    
    // threads.push()
  }
  

 

  



  // const res = await gmail.users.messages.get({
  //   userId: 'me',
  //   id: '177404f258783ed1'
  // });
  // console.log(res.data);
  
  
  // gmail.users.messages.list({
  //   userId: 'me',
  // }, (err, res) => {
  //   if (err) return console.log('The API returned an error: ' + err);
  //   const emails = res.data;
  //   if (emails.length) {
  //     console.log('Emails:');
  //     emails.forEach((email) => {
  //       console.log(`- ${email}`);
  //     });
  //   } else {
  //     console.log('No emails found.');
  //   }
  // });
}

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
];

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}
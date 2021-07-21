// backend/app.js

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open'); // get rid of this shit later npm
const destroyer = require('server-destroy');
const mongo = require('mongodb').MongoClient;
const base64url = require('base64url');

const express = require('express');
const cors = require('cors');
const {google} = require('googleapis');
const gmail = google.gmail('v1');

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
  console.log(authorizeUrl);
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
  res.send("<script>window.opener.location.href='http://localhost:3000/package-tracker';window.close();</script>");
})

async function runSample() {
  // const res = await gmail.users.threads.list({userId: 'me'});
  // console.log(res.data);
  // use next page token

  // const res = await gmail.users.threads.get({
  //   userId: 'me',
  //   id: '177404f258783ed1'
  // });
  // console.log(res.data);
  // go through each message? (may be more than one in a thread)

  // const res = await gmail.users.messages.list({
  //   userId: 'me',
  //   q: 'package'
  // });
  // console.log(res.data);

  const res = await gmail.users.messages.get({
    userId: 'me',
    id: '177404f258783ed1',
    format: 'raw'
  });
  console.log(base64url.decode(res.data.raw));

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
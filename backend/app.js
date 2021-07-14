// backend/app.js

const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000']
}));
const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!!" });
});

app.post("/api/v1/auth/google", async (req, res) => {
  console.log("Creating token");
  console.log(req);
  const { token } = req.body;

  console.log("Verifying token");
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.REACT_APP_GOOGLE_CLIENT_ID
  });
  const { name, email, picture } = ticket.getPayload();

  // const user = await db.user.upsert({
  //   where: { email: email },
  //   update: { name, picture },
  //   create: { name, email, picture }
  // });
  
  // res.status(201);
  res.json(ticket.getPayload);
});
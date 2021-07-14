// backend/app.js

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({
  origin: ['http://localhost:3000']
}));

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!!" });
});

app.post("/api/v1/auth/google", (req, res) => {
  res.json({ 
    message: "Hello!" 
  });
});
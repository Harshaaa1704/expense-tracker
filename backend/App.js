const express = require('express')
const cors = require('cors');
const { db } = require('./db/db');
const {readdirSync} = require('fs');
const cookieParser = require('cookie-parser');
const app = express()
require('dotenv').config()

const PORT = process.env.PORT;



const allowedOrigins = [
  "http://localhost:3000",
  "https://spendx.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);


app.use(express.json())

app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('API is running....')
});
readdirSync('./routes').map((route) => app.use('', require('./routes/' +route)))

const server = () => {
    db()
    app.listen(PORT, () => {
        console.log(PORT);
    })
}
server()
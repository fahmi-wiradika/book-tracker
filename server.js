'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const path        = require('path');
require('dotenv').config();
require('./DB-setup/db-connection.js');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = process.env.NODE_ENV === 'test' ? require('./test-runner') : null;

const app = express();

const mongoose = require("mongoose");
const connectDB = require("./DB-setup/db-connection.js");

app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 0 && process.env.MONGO_URI_LIBRARY) {
    try {
      await connectDB(process.env.MONGO_URI_LIBRARY);
    } catch (err) {
      console.error('DB Connection Error:', err);
    }
  }
  next();
});

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(cors({origin: '*'})); //USED FOR FCC TESTING PURPOSES ONLY!

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
//Start our server and tests!
const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI_LIBRARY);
    app.listen(port, () => {
      console.log("Your app is listening on port " + port);
      if (process.env.NODE_ENV === "test" && runner) {
        console.log("Running Tests...");
        setTimeout(function () {
          try {
            runner.run();
          } catch (e) {
            console.log("Tests are not valid:");
            console.error(e);
          }
        }, 3500);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

start();

module.exports = app; //for unit/functional testing
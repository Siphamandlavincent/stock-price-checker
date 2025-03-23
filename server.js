'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
<<<<<<< HEAD
const MongoClient = require('mongodb').MongoClient;

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
=======
const helmet = require('helmet');
>>>>>>> 32f600d4a850403412261740f1d18dfec2c90e70

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
    },
  },
  hidePoweredBy: true,
  noSniff: true,
  frameguard: {
    action: 'deny'
  },
  xssFilter: true,
  dnsPrefetchControl: {
    allow: false
  },
  referrerPolicy: { 
    policy: 'same-origin' 
  }
}));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
const fccTestingRoutes = require('./routes/fcctesting');
fccTestingRoutes(app);

//Routing for API 
const apiRoutes = require('./routes/api');
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Test MongoDB connection
MongoClient.connect(process.env.MONGO_URI, { 
  useUnifiedTopology: true,
  useNewUrlParser: true,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true
})
  .then(client => {
    console.log('Connected successfully to MongoDB');
    client.close();
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });

//Start our server and tests!
const startServer = async (port) => {
  try {
    const listener = await new Promise((resolve, reject) => {
      const server = app.listen(port)
        .once('listening', () => resolve(server))
        .once('error', reject);
    });
    console.log('Your app is listening on port ' + listener.address().port);
if(process.env.NODE_ENV==='test') {
  console.log('Running Tests...');
  const runner = require('./test-runner');
  setTimeout(function () {
    try {
      runner.run();
        } catch (e) {
          console.log('Tests are not valid:');
          console.error(e);
        }
      }, 1500);
    }
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}`);
      await startServer(port + 1);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  }
};

startServer(process.env.PORT || 3000);
module.exports = app;

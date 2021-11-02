
const express = require('express')
  , session = require('express-session')
  , authRoutes = require('./routes/auth-routs')
  , profileRoutes = require('./routes/profile-routs')
  , main = require('./routes/user.js')
  , passportSetup = require('./config/passport-setup')
  , keys = require('./config/keys')
  , passport = require('passport')
  , morgan = require('morgan')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override') 
  , router = require('./routes/user.js')
  , favicon = require('express-favicon')
  , open = require('open')
  , marko = require('marko')
  , http = require('http')
  , https = require('https')
  , fs = require('fs')
  , cookieParser = require('cookie-parser');

var app = express();

app.use(favicon('./views/faviconWhite.png'));

app.set('view engine', 'ejs');

app.use(cookieParser(keys.session.cookieKey,{
  maxAge:24*60*60*1000, 
  keys: [keys.session.cookieKey], 
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(methodOverride());

app.use(session({
  secret: keys.session.cookieKey,
  cookie: {secure: false},
  saveUninitialized: true,
  resave: false,
}));

app.use(passport.initialize());
app.use(passport.session());

//set up routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/main', main);

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded(
  {
    limit: '50mb', 
    extended: true
  }
));


app.use(router);

app.use(express.static('./views'));

// switch morgan to 'combined'
app.use(morgan('short'));

app.get('/', (req, res) => {
  console.log('responding to root route');
  res.render('login');
  /* res.send('Hello from root'); */
});
app.get('/EmployeeSearch', (req, res) => {
  res.render('EmployeeSearch');
  /* res.send('Hello from root'); */
});
app.get('/schedule', (req, res) => {
  res.render('schedule');
  /* res.send('Hello from root'); */
});
app.get('/FTEGraph', (req, res) => {
  res.render('FTEGraph');
  /* res.send('Hello from root'); */
});
app.get('/edituser', (req, res) => {
  res.render('edituser');
  /* res.send('Hello from root'); */
});
app.get('/emailer', (req, res) => {
  res.render('emailer');
  /* res.send('Hello from root'); */
});
app.get('/restrict', (req, res) => {
  res.render('restrict');
  /* res.send('Hello from root'); */
});
app.get('/weeklymatrix', (req, res) => {
  res.render('weeklymatrix');
  /* res.send('Hello from root'); */
});
app.listen(3010, () => {
  console.log('Welcome to resourcemanager');
});


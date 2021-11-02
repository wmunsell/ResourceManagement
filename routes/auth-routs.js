const router = require('express').Router()
    , passport = require('passport')
    , express = require('express')
    , keys = require('../config/keys')
    , cookieParser = require('cookie-parser')
    , OutlookStrategy = require('passport-outlook').Strategy;

var app = express();

app.get('/', function(req, res){
    res.render('index', { user: req.user });
  });

app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
  });

//auth login
router.get('/login', (req, res) =>{
    res.render('login', {user: req.user});
});

//auth with outlook
router.get('/outlook', 
    passport.authenticate('windowslive', 
    {
    scope: [
        'openid',
        'profile',
        'offline_access',
        'https://outlook.office.com/Mail.Read'
      ]
    }), 
    function(req, res){
        // The request will be redirected to Outlook for authentication, so
        // this function will not be called.
    }
);

router.get('/outlook/redirect', 
  passport.authenticate('windowslive', { failureRedirect: '/restrict' }), 
  function(req, res) {
    res.redirect('/profile/');
    /* res.render('/', {user: req.user}); */
  
});

//auth logout
router.get('/logout', (req,res, next)=>{
    //handle with passport
    req.logOut();
    res.redirect('https://login.windows.net/common/oauth2/logout?post_logout_redirect_uri=https://resourcemanager.yourwebsite.com');
});

function ensureAuthenticated(req, res, next) {
  if (passport.isAuthenticated()){
    return next();
  }
  else{
    // Return error content: res.jsonp(...) or redirect: res.redirect('/login')
    res.redirect('/outlook');
  }
}

module.exports = router;

const { dateFormat } = require('highcharts');

const express = require('express')
    , pool = require('../routes/databaseConnection.js')
    , path = require('path')
    , session = require('express-session')
    , keys = require('./keys') 
    , passport = require('passport')
    , util = require('util')
    , OutlookStrategy = require('passport-outlook').Strategy;

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(
    new OutlookStrategy({
        // options for the outlook strategy
        clientID: keys.outlook.clientID, 
        clientSecret: keys.outlook.clientSecret,
        callbackURL:'xxx', 
        state: true,
        pkce: true
    }, (accessToken, refreshToken, profile, done) => {

        var today = new Date();
        var todate = new Date().toDateString();
        var totime = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

        var email = profile._json.EmailAddress;
        var domain = email.split("@");

        if(domain[1] == "someemaildomain.com"){
            var selectquery = "select * from resourcemanager_user where user_id = '"+profile.id+"'";
            pool.query(selectquery,function(err,rows){
                if (err)
                    return done(err);
                if (rows.length>0) {
                    console.log('Welcome '+profile.displayName);

                    var updateQuery = "UPDATE resourcemanager_user SET last_login_date = '"+todate+"', last_login_time = '"+totime+"' where user_id = '"+profile.id+"'";
                    pool.query(updateQuery, function(err,rows){
                        if (err){
                            return done(err);
                        }
                    });

                    return done(null, profile.id);
                } else {
                    // if there is no user with that email
                    // create the user
                    var insertQuery = "INSERT INTO resourcemanager_user ( user_id, alias, name, email ) values  ('"+profile.id+"', '"+profile.alias+"', '"+profile.displayName+"', '"+profile.emails[0].value+"')";
                    pool.query(insertQuery, function(err,rows){
                        if (err){
                            return done(err);
                        }
                        console.log('Welcome '+profile.displayName);
                    });
                    return done(null, profile);	
                }	
            });
        } else {
            return done(null, false);
        }

    }
));


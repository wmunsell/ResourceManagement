const { concat } = require('lodash');

const router = require('express').Router()
    , pool = require('./databaseConnection.js')
    , express = require('express');

var app = express();

const authCheck = (req, res, next) => {
    if(!req.user){
        // if user is not logged in 
        res.redirect('/auth/login');
    }else{
        // if logged in
        next();
    }
};

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    var weeksToAdd = ((d.getFullYear()-new Date().getFullYear())*52)
    return weekNo+weeksToAdd;
}
function getCurrentYear() {
    var d = new Date();
    var n = d.getFullYear();
    return n;
}

router.get('/', authCheck, (req, res) => {
    /* res.render('profile') */
    const queryString = "SELECT * FROM resourcemanager_user WHERE user_id like '"+req.user+"'";
    var username = '';
    pool.query(queryString, (err, rows) => {
        if (err) {
          console.log('failed query request ' + err);
          res.sendStatus(500);
          return;
        }

        var result = getWeekNumber(new Date());
        var currentweeknum = parseInt(result);
        var currentYear = getCurrentYear();

        var username = req.user.displayName;
        var pman = "";
        var pdisc = "All_Disciplines";
        var poffice = "All_Offices";
        var pnum = "";
        var edisc = "All_Disciplines";
        var eoffice = "All_Locations";
        var week = currentYear+"-W"+currentweeknum;
        var esector = "All_Sectors"

        if(rows.length>0){

            for(var i=0; i<rows.length; i++){
                username = rows[i].name;

                pman = rows[i].filter_pman;

                if(rows[i].filter_pdisc!=null){
                    pdisc = rows[i].filter_pdisc;
                }

                if(rows[i].filter_poffice!=null){
                    poffice = rows[i].filter_poffice;
                }

                pnum = rows[i].filter_pnum;

                if(rows[i].filter_edisc!=null){
                    edisc = rows[i].filter_edisc;
                }

                if(rows[i].filter_eoffice!=null){
                    eoffice = rows[i].filter_eoffice;
                }

                if(rows[i].filter_week!=null){
                    week = rows[i].filter_week;
                }
                
                if(rows[i].filter_sector!=null){
                    esector = rows[i].filter_sector;
                }
            }
        }
        /* res.send('you are loogd in, this is your profile - '+username);  */
        res.render('index', {user: username, manager: pman, projdisc: pdisc, projoffice: poffice, projnum: pnum, empdisc: edisc, empoffice: eoffice, week: week, empsector: esector});
      });
})



module.exports = router;




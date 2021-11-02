const express = require('express')
  , bodyParser = require('body-parser')
  , router = express.Router()
  , pool = require('./databaseConnection.js');

router.use(bodyParser.json());
var _ = require('lodash');
const { query } = require('./databaseConnection.js');
var app = express();

router.get('/messages', (req, res) => {
    res.end();
});

router.get('/users', (req, res) => {
    const queryString = 'SELECT * FROM testTable';
    pool.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log('failed query request within users ' + err);
        res.sendStatus(500);
        return;
      }
      
      res.json(rows);
    });
});

router.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    const queryString = 'SELECT * FROM testTable WHERE idtestTable = ?';
    pool.query(queryString, [userId], (err, rows, fields) => {
      if (err) {
        console.log('failed query request within user id ' + err);
        res.sendStatus(500);
        return;
      }
      const users = rows.map((row) => {
        return { firstName: row.firstName, lastName: row.lastName }
      });
  
      res.json(users);
    });
});


router.get('/gantt_data', (req, res) => {
  var standard = ['project_phases.id', 'Project_Description', 'Ajera_Project_ID', 'Client', 'title', 'start', 'end', 'Hours_Remaining', 'FTEs'];
  var columns = standard.concat(req.session.passport.headerfields);
  if (req.session.passport.showStart == false ){
    const queryStringWdate = `SELECT `+columns+` 
                              FROM project_phases 
                              LEFT JOIN hourmap on hourmap.PhaseID = project_phases.id AND hourmap.year_week LIKE '`+req.session.passport.pWeek+`' 
                              WHERE project_phases.Project_Manager LIKE `+req.session.passport.fman+` 
                              AND (Ajera_Project_ID LIKE `+req.session.passport.fnum+`) 
                              AND (project_phases.Department LIKE `+req.session.passport.fdis+`) 
                              AND (project_phases.Department LIKE `+req.session.passport.foff+`) 
                              AND (project_phases.Phase_Status = "Active") 
                              ORDER BY Ajera_Project_ID, phase_order`;
    pool.query(queryStringWdate, (err, rows, fields) => {
      if (err) {
        console.log('failed query request within gantt data ' + err);
        res.sendStatus(500);
        return;
      }
      var titles = [];
      for(var i=0; i<rows.length; i++){
        var title = rows[i].project_title;
        if (titles.includes(title)===false){
          titles.push(rows[i].project_title);
          req.session.passport.highlighted.push(i);
        }else{
        }  
        i++;
      }
      res.json(rows);
    });
  }
});

/*----------------------------------------------------------------------------------------------------------------------------------------*/
router.get('/employee_gantt_data', (req, res) => {
  var standard = ['project_phases.id', 'Project_Description', 'Ajera_Project_ID', 'title', 'start', 'end', 'hours_budgeted'];
  var columns = standard.concat(req.session.passport.employeeName);
  var projnum = req.session.passport.projectnumber;
  var week = req.session.passport.pWeek;
  var weeknum = parseInt(week.slice(-2));
  var year = parseInt(week.slice(0,4));
  var weekp1 = year+"-W"+(weeknum+1);
  var weekp2 = year+"-W"+(weeknum+2);
  var weekp3 = year+"-W"+(weeknum+3);
  var weekp4 = year+"-W"+(weeknum+4);
  var weekp5 = year+"-W"+(weeknum+5);
  var abvweekp1 = "W"+(weeknum+1);
  var abvweekp2 = "W"+(weeknum+2);
  var abvweekp3 = "W"+(weeknum+3);
  var abvweekp4 = "W"+(weeknum+4);
  var abvweekp5 = "W"+(weeknum+5);
  var result;
  /* get the project durration in weeks and add the weeks to the headers */
  if (req.session.passport.showStart == false ){
    /* const queryString = 'SELECT Project_Description, Ajera_Project_ID, title, start, end, hours_budgeted, Paul_Schram FROM project_phases LEFT JOIN hourmap on hourmap.PhaseID = project_phases.id AND hourmap.year_week LIKE \"'+req.session.passport.pWeek+'\" WHERE (Ajera_Project_ID LIKE \"'+req.session.passport.projectnumber+'\") AND (Phase_Status = "Active") ORDER BY project_id, phase_order'; */
    const queryString =  `create temporary table if not exists temp_table as(
                            SELECT `+columns+` 
                            FROM project_phases 
                            LEFT JOIN hourmap on hourmap.PhaseID = project_phases.id AND hourmap.year_week LIKE '`+req.session.passport.pWeek+`' 
                            WHERE (Ajera_Project_ID LIKE '`+projnum+`') 
                            AND (Phase_Status = "Active") 
                            ORDER BY Ajera_Project_ID, phase_order)
                          ;
                          ALTER TABLE temp_table ADD `+abvweekp1+` INT;
                          ALTER TABLE temp_table ADD `+abvweekp2+` INT;
                          ALTER TABLE temp_table ADD `+abvweekp3+` INT;
                          ALTER TABLE temp_table ADD `+abvweekp4+` INT;
                          ALTER TABLE temp_table ADD `+abvweekp5+` INT;
                          SET SQL_SAFE_UPDATES = 0;
                          UPDATE temp_table
                          left join hourmap on hourmap.PhaseID = temp_table.id AND hourmap.year_week LIKE '`+weekp1+`'
                          set temp_table.`+abvweekp1+` = hourmap.`+req.session.passport.employeeName+`
                          ;
                          UPDATE temp_table
                          left join hourmap on hourmap.PhaseID = temp_table.id AND hourmap.year_week LIKE '`+weekp2+`'
                          set temp_table.`+abvweekp2+` = hourmap.`+req.session.passport.employeeName+`
                          ;
                          UPDATE temp_table
                          left join hourmap on hourmap.PhaseID = temp_table.id AND hourmap.year_week LIKE '`+weekp3+`'
                          set temp_table.`+abvweekp3+` = hourmap.`+req.session.passport.employeeName+`
                          ;
                          UPDATE temp_table
                          left join hourmap on hourmap.PhaseID = temp_table.id AND hourmap.year_week LIKE '`+weekp4+`'
                          set temp_table.`+abvweekp4+` = hourmap.`+req.session.passport.employeeName+`
                          ;
                          UPDATE temp_table
                          left join hourmap on hourmap.PhaseID = temp_table.id AND hourmap.year_week LIKE '`+weekp5+`'
                          set temp_table.`+abvweekp5+` = hourmap.`+req.session.passport.employeeName+`
                          ;
                          select * from temp_table; 
                          DROP TEMPORARY TABLE temp_table;`;
    pool.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log('failed query request within employee gantt data ' + err);
        res.sendStatus(500);
        return;
      }
      for (var i=0;i<rows.length;i++){
        if(rows[i].constructor.name == 'Array') {
            result=rows[i];     
        }
      }
      res.json(result);
    });
  }
});
/*----------------------------------------------------------------------------------------------------------------------------------------*/

router.get('/employee_data', (req, res) => {
  var standard = ['Project_Description', 'Ajera_Project_ID', 'title', 'start', 'end', 'hours_budgeted'];
  var columns = standard.concat(req.session.passport.employeeName);
  if (req.session.passport.showStart == false ){
    const queryString = `SELECT `+columns+` 
                          from hourmap 
                          left join project_phases on project_phases.id = hourmap.PhaseID 
                          where `+req.session.passport.employeeName+` <> "" 
                          AND (year_week = '`+req.session.passport.pWeek+`')`;

    pool.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log('failed query request within employee data ' + err);
        console.log(queryString);
        res.sendStatus(500);
        return;
      }
      var titles = [];
      for(var i=0; i<rows.length; i++){
        var title = rows[i].project_title;
        if (titles.includes(title)===false){
          titles.push(rows[i].project_title);
          req.session.passport.highlighted.push(i);
        }else{
        }  
        i++;
      }
      res.json(rows);
    });
  }
});

router.post('/ename', (req, res) => {
  var name = "\'%"+req.body.name+"%\'";
  var number = req.body.number; 
  const queryString = `SELECT concat(first_name, "_", last_name) as fullname 
                        FROM employees 
                        WHERE concat(first_name, " ", last_name) LIKE `+name;
  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request within ename ' + err);
      res.sendStatus(500);
      return;
    }
    if(rows[0]){
      var fullname = rows[0].fullname; 
      req.session.passport.employeeName = fullname;
      res.send(req.session.passport.employeeName);
    }else{
      res.sendStatus(500);
      return;
    }
  });
  
}); 

router.post('/schprojnumber', (req, res) => {
  var eNum = req.body.number;
  req.session.passport.projectnumber = eNum;
  res.send(req.session.passport.projectnumber);
}); 

/* router.get('/enum', (req, res) => {
  var eNum = req.body.enum;
  console.log('selected number: '+eNum);
  req.session.passport.projectnumber = eNum;
  res.status(200).send(req.session.passport.projectnumber);
}); */

router.post('/durration', (req, res) => {
  var number = "\'%"+req.body.number+"%\'";
  const queryString = `SELECT start, end 
                        from project_phases 
                        where Ajera_Project_ID like`+number;

  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request within ename ' + err);
      res.sendStatus(500);
      return;
    }

    /* get the start/end dates */
    /* select the min start date */
    /* select the max end date */
    /* calculate the total number of weeks between */
    /* return total */ 

    var minstart;
    var maxend;

    for(var i=0; i<rows.length; i++){
      var startdate = rows[i].start; 
      var enddate = rows[i].end; 
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1; 
      var yyyy = today.getFullYear();
      var todaydate = mm+'/'+dd+'/'+yyyy;

      if(startdate != ''){
        if(minstart === undefined){
          minstart = startdate;
        }else if(startdate<minstart){
          minstart = startdate;
        }
      }
      if(maxend != ''){
        if(maxend === undefined){
          maxend = enddate;
        }else if(enddate>maxend){
          maxend = enddate;
        }
      }
    }
    if(minstart == undefined){
      minstart = todaydate;
    }else if(minstart<todaydate){
        minstart = todaydate;
    }

    var weeks = (((maxend-minstart)/3600000)/24)/7;
  });
  
}); 

router.get('/ftes', (req, res) => {
  if (req.session.passport.showStart == false ){
    /* const queryString = 'SELECT sum(Hours_Budgeted) FROM project_phases WHERE ' */
    const queryString = `SELECT project_phases.id, title, start, end, Hours_Budgeted, Hours_Worked, Hours_Remaining 
                          FROM project_phases 
                          LEFT JOIN hourmap on hourmap.PhaseID = project_phases.id 
                          WHERE Project_Manager LIKE `+req.session.passport.fman+`
                          AND (Ajera_Project_ID LIKE `+req.session.passport.fnum+`) 
                          AND (project_phases.Department LIKE `+req.session.passport.fdis+`) 
                          AND (project_phases.Department LIKE `+req.session.passport.foff+`) 
                          AND (project_phases.Phase_Status = "Active") 
                          AND (hourmap.year_week = '`+req.session.passport.pWeek+`' or hourmap.year_week is Null)`; 

    pool.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log('failed query request within ftes ' + err);
        res.sendStatus(500);
        return;
      }
      res.json(rows);
    });
  }
});

router.get('/availfte', (req, res) => {
  if (req.session.passport.showStart == false ){
    /* const queryString = 'SELECT sum(Hours_Budgeted) FROM project_phases WHERE ' */
    const queryString = `SELECT SUM(utilization)/100 as total 
                          FROM employees 
                          LEFT JOIN divisions on divisions.id = employees.division_id 
                          LEFT JOIN offices on offices.id = employees.office_id 
                          WHERE (deleted_at is null) 
                          AND (active = 1) 
                          AND (divisions.name LIKE `+req.session.passport.eDept+` or divisions.name is Null) 
                          AND (offices.name LIKE `+req.session.passport.eOff+` or offices.name is Null)`; 

    pool.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log('failed query request within ftes ' + err);
        res.sendStatus(500);
        return;
      }
      res.json(rows);
    });
  }
});

router.get('/highlight', (req, res) => {
  const projTitles = Object.assign({}, req.session.passport.highlighted);
  res.json(projTitles);
});

router.get('/searchHeader', (req, res) => {
  res.send(req.session.passport.employeeName);
});

router.post('/sendemail', (req, res) => {

  var name = req.body.name;
  var email = req.body.email;
  var type = req.body.type;
  var message = req.body.message;

  var nodemailer = require('nodemailer');

  var transport = nodemailer.createTransport({
    host: 'smtp.office365.com', // Office 365 server
    port: 587,     // secure SMTP
    secure: false, // false for TLS - as a boolean not string - but the default is false so just remove this completely
    auth: {
      user: "youremail@yourdomain.com", 
      pass: "password", 
      },
    tls: {
        ciphers: 'SSLv3'
    }
  });

  var mailOptions = {
    from: "youremail@yourdomain.com",
    to: 'theiremail@theirdomain.com',
    subject: name + " - " + type,
    text: message,
  };
  
  transport.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    res.send(info.messageId);
  });
});

router.get('/getuserinfo',(req, res) => {
  /* res.render('profile') */
  console.log(req.session.passport.id);
  const queryString = "SELECT * FROM resourcemanager_user WHERE user_id like '"+req.session.passport.id+"'";
  var username = '';
  var email = '';
  pool.query(queryString, (err, rows) => {
      if (err) {
        console.log('failed query request ' + err);
        res.sendStatus(500);
        return;
      }
      for(var i=0; i<rows.length; i++){
          username = rows[i].name;
          email = rows[i].email
      }
      /* res.send('you are loogd in, this is your profile - '+username);  */
      res.send({user: username, email: email});
    });
})

router.get('/headers', (req, res) => {
  var sectors = req.session.passport.eSec;
  var queryString;
  if(sectors == "'%'"){
    queryString = `SELECT CONCAT(first_name," ", last_name) as Employee 
                    FROM employees 
                    LEFT JOIN divisions on divisions.id = employees.division_id 
                    LEFT JOIN offices on offices.id = employees.office_id 
                    LEFT JOIN sectors_map on sectors_map.employee_id = employees.id
                    LEFT JOIN sectors on sectors.id = sectors_map.sector_id
                    WHERE (deleted_at is null) 
                    AND (active = 1) 
                    AND (divisions.name LIKE `+req.session.passport.eDept+` or divisions.name is Null) 
                    AND (offices.name LIKE `+req.session.passport.eOff+` or offices.name is Null)
                    GROUP BY Employee;`;
  }else{
    queryString = `SELECT CONCAT(first_name," ", last_name) as Employee 
                    FROM employees 
                    LEFT JOIN divisions on divisions.id = employees.division_id 
                    LEFT JOIN offices on offices.id = employees.office_id 
                    LEFT JOIN sectors_map on sectors_map.employee_id = employees.id
                    LEFT JOIN sectors on sectors.id = sectors_map.sector_id
                    WHERE (deleted_at is null) 
                    AND (active = 1) 
                    AND (divisions.name LIKE `+req.session.passport.eDept+` or divisions.name is Null) 
                    AND (offices.name LIKE `+req.session.passport.eOff+` or offices.name is Null)
                    AND (sector IN `+req.session.passport.eSec+`)
                    GROUP BY Employee;`;
  }

  //const queryString = 'SELECT distinct(Employee) FROM employees';
  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request within headers ' + err);
      res.sendStatus(500);
      return;
    }
    if(req.session.passport.headerfields.length>0){
      req.session.passport.headerfields = [];
    }
    var tempheaders = [];
    const emphead = rows.map((row) => {
      var fixname = row.Employee.replace(/ /g, "_");
      var stripname = fixname.replace(".", "");
      tempheaders.push(stripname);
      return {name: row.Employee} 
    });
    req.session.passport.headerfields = tempheaders;
    res.json(emphead);
  });
});

router.get('/employees', (req, res) => {
  const queryString =  `SELECT concat(first_name, " ", last_name) as Employee 
                        FROM employees 
                        WHERE deleted_at is null`;

  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request within employees ' + err);
      res.sendStatus(500);
      return;
    }
    res.json(rows);
  });
});

router.get('/projnums', (req, res) => {
  const queryString = `SELECT DISTINCT(Ajera_Project_ID) as projnums 
                        FROM project_phases`;

  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request within projnums ' + err);
      res.sendStatus(500);
      return;
    }
    res.json(rows);
  });
});

router.get('/managers', (req, res) => {
  const queryString = `SELECT DISTINCT(Project_Manager) as Employee 
                        FROM resourcemanager.project_phases`;

  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request within employees ' + err);
      res.sendStatus(500);
      return;
    }
    res.json(rows);
  });
});

router.post('/user_create', (req, res) => {
    const path = require('path');
    const id = req.body.create_id_number;
    const firstName = req.body.create_first_name;
    const lastName = req.body.create_last_name;
    const projectName = req.body.create_project_name;
    const location = req.body.create_location;
    const department = req.body.create_department_name;
    const queryString = 'INSERT INTO testTable (otherInfo, lastName, firstName, department) VALUES (?, ?, ?, ?)';
    pool.query(queryString, [location, lastName, firstName, department], (err, results, fields) => {
      if(err) {
        console.log('Failed to inser new user: ', err);
        res.sendStatus(500);
        return;
      }
      res.redirect('/form.html');
    });
});

router.post('/employeeid', (req, res) => {
  var name = req.body.empname;
  const queryString = 'SELECT id FROM employees WHERE concat(first_name, " ", last_name) = ?';
  pool.query(queryString,[name],(err, rows, fields) => {
    if (err) {
      console.log('failed query request within employee id ' + err);
      res.sendStatus(500);
      return;
    }
    else{
      res.json(rows[0].id);
    }
  });
});

router.post('/scheduleid', (req, res) => {
  var schedule = req.body.schedule;

  console.log(schedule);

  const queryString = `SELECT schedule.id 
                        FROM schedule 
                        JOIN employees on employees.id = schedule.employee_id 
                        WHERE CONCAT(employees.first_name, " ", employees.last_name)=? 
                        AND schedule.project_phase=?
                        AND schedule.phase_id=? 
                        AND schedule.year_week=?`;

  pool.query(queryString,[schedule[0].name, schedule[0].phaseName, schedule[0].phaseid, schedule[0].week],(err, rows, fields) => {
    if (err) {
      console.log('failed query request within schedule id ' + err);
      res.sendStatus(500);
      return;
    }
    else{
      var data = "NAN";
      if (typeof rows[0] === 'undefined'){

      }else{
        data = rows[0].id
      }
/*       try{
        data = rows[0].id;
      }
      catch(err){
        console.log(err);
      } */
      res.json(data);
    }
  });
});

router.get('/totals', (req, res) => {
  var totalsdict = {};
  var newheaders = [];
  for (item in req.session.passport.headerfields){
    var name = req.session.passport.headerfields[item];
    name = name.replace("'", ""); 
    name = name.replace(".", "");
    newheaders.push('SUM('+name+') as '+name);
  }

  const queryString = 'SELECT '+newheaders+' FROM hourmap where year_week = ?';
  pool.query(queryString, [req.session.passport.pWeek], (err, rows, fields) => {
    if (err) {
      console.log('failed query request within totals ' + err);
      res.sendStatus(500);
      return;
    }
    var returnvalue = {};
    for (name in req.session.passport.headerfields){
      name = req.session.passport.headerfields[name];
      var hours = rows[0][name];
      if (hours === null){
        returnvalue[name] = 0;
      }else{
        returnvalue[name] = hours;
      }
    }
    res.json(rows);
  });
});

router.get('/hourmap', (req, res) => {
  const queryString = 'SELECT * FROM hourmap JOIN employees on employees.id = schedule.employee_id JOIN schedule on schedule.id = hourmap.ScheduleID';
  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request within hourmap ' + err);
      res.sendStatus(500);
      return;
    }
    res.json(rows);
  });
});

router.post('/pophourmap', (req, res) => {
  const path = require('path');
  const empschedule = req.body.schedule;
  var ename = empschedule.name.replace(/ /g, "_");
  var ename = ename.replace(".", "");
  var ehours = empschedule.hours;
  var eschedule = empschedule.sid;
  var phaseid = empschedule.phid;
  var projkey = empschedule.pkey;
  var yearweek = empschedule.week;
  var queryString = ''
  if (ehours == 0){
    queryString = 'UPDATE hourmap SET `'+ename+'`= NULL WHERE hourmap.id = (SELECT id FROM (SELECT id FROM hourmap WHERE ProjectKey='+projkey+' AND (PhaseID='+phaseid+') AND (year_week = \"'+yearweek+'\")) temptbl)';
  }else{
    queryString = 'UPDATE hourmap SET `'+ename+'`='+ehours+' WHERE hourmap.id = (SELECT id FROM (SELECT id FROM hourmap WHERE ProjectKey='+projkey+' AND (PhaseID='+phaseid+') AND (year_week = \"'+yearweek+'\")) temptbl)';
  }
  pool.query(queryString,(err, results, fields) => {
    if(err) {
      console.log('Failed to update hourmap: ', err);
      res.sendStatus(500);
      return;
    }
    res.end();
  });
});  

router.post('/lodash', (req, res) => {
  const path = require('path');
  var _ = require('lodash');
  const totalvariables = req.body

  var output =
    _(totalvariables)
      .groupBy('week')
      .map((objs, key) => ({
          'week': key,
          'data': parseFloat(_.sumBy(objs, 'data').toFixed(3)) }))
      .value();
  res.json(output);
});  

router.post('/schedule', function (req, res) {
  var schedule = req.body.schedule;
  var completed = 0;
  schedule.forEach(function(item) {
    req.session.passport.employeeName = item.name;
    if (item.sid == "NAN"){
      var queryStringInsert = `INSERT INTO schedule (employee_id, project_key, phase_id, project_phase, year_week, hours) 
                                  VALUES((SELECT id FROM employees WHERE concat(first_name, " ", last_name)='`+req.session.passport.employeeName+`'),
                                  `+item.pkey+`,
                                  `+item.phid+`,
                                  '`+item.phaseName+`',
                                  '`+item.week+`',
                                  `+item.hours+`);
                                  SELECT LAST_INSERT_ID();`;

      pool.query(queryStringInsert, (err, results, body) => {
        if (!err && res.statusCode == 200) {
          completed = completed + 1;
          onComplete(results); //attempt completion
      }
      if (err){
        console.log('Failed to submit hours: ', err);
      }
      });
    }else{
      var queryStringUpdate = `UPDATE schedule 
                                SET hours=`+item.hours+` 
                                WHERE id=`+item.sid+`;`;

      pool.query(queryStringUpdate, (err, results, body) => {
        if (!err && res.statusCode == 200) {
        completed = completed + 1;
        onComplete(results); //attempt completion
        }
        if (err){
        console.log('Failed to submit hours: ', err);
        }
        });
      
    }

  });

  function onComplete(results){
    if(completed != schedule.length) {
      return;
    }
    res.json(results); 
    // ... rest of code that relies on results
  };
});
router.post('/projectKey', (req, res) => {
  var schedule = req.body.schedule;
  const queryString = `SELECT Ajera_Project_Key
                        FROM project_phases 
                        WHERE Ajera_Project_ID LIKE '`+schedule[0].pnum+`' 
                        AND title LIKE '`+schedule[0].phaseName+`';`;
  pool.query(queryString,(err, rows, fields) => {
    if (err) {
      console.log('failed query request within projectKey ' + err);
      console.log(queryString);
      res.sendStatus(500); 
      return;
    }
    else{
      res.json(rows[0].Ajera_Project_Key);
    }
  });
});

router.post('/phaseID', (req, res) => {
  var schedule = req.body.schedule;
  const queryString = `SELECT project_phases.id AS id
                        FROM project_phases 
                        WHERE Ajera_Project_ID LIKE '`+schedule[0].pnum+`' 
                        AND title LIKE '`+schedule[0].phaseName+`'`;

  pool.query(queryString,(err, rows, fields) => {
    if (err) {
      console.log('failed query request within phase id ' + err);
      res.sendStatus(500); 
      return;
    }
    else{
      res.json(rows[0].id);
    }
  });
});

router.get('/getuser', (req, res) => {
  var schedule = req.body.schedule;

  const queryString = `SELECT concat(first_name, " ", last_name) as Employee, divisions.name as Department, offices.name as Office, group_concat(sectors.sector separator ';'), utilization as Utilization 
                        FROM resourcemanager.employees 
                        left join divisions on divisions.id = employees.division_id 
                        left join offices on offices.id = employees.office_id 
                        left join sectors_map on sectors_map.employee_id = employees.id
                        left join sectors on sectors.id = sectors_map.sector_id
                        where offices.name like `+req.session.passport.eOff+` 
                        and (divisions.name like `+req.session.passport.eDept+`) 
                        and (deleted_at is null and active = 1)
                        group by employees.id`;

  pool.query(queryString,(err, rows, fields) => {
    if (err) {
      console.log('failed query request within phase id ' + err);
      res.sendStatus(500); 
      return;
    }
    else{
      res.json(rows);
    }
  });
});

/* ------------------------------------------------------------ */

router.post('/updateemployee', (req, res, next) => {
	const path = require('path');
	const emprow = req.body.row;

	var empname = emprow[0];
	var empdis = emprow[1];
	var empoff = emprow[2];
	var empsec = emprow[3];
	var empute;

	if (emprow[4].toString().includes(" ")){
	empute = emprow[4].split(' ');
	empute = parseInt(empute[1]);
	}else{
	empute = emprow[4];
	}

	var queryString = `update employees 
					 set division_id = (select id from divisions where name like '`+empdis+`'), 
					 office_id = (select id from offices where name like '`+empoff+`'), 
					 utilization = `+empute+` 
					 where concat(first_name, ' ', last_name) = '`+empname+`';`;

	pool.query(queryString, (err, results, fields) => {
	if(err) {
	  console.log('Failed to update employees (/updateemployee): ', err);
	  res.sendStatus(500);
	  return;
	}
	next();
	});
  
	var seclist;
  var ismultiple = empsec.includes(';');

	if(empsec.includes(';')){
    seclist = empsec.split(';');

    var strarr = JSON.stringify(seclist);
    var result = strarr.replace('[', '(');
    result = result.replace(']', ')');
    result = result.replace(/"/g, "'");
    
	  seclist.forEach(function(secitem){
		  var queryString2 = `insert into sectors_map(id, employee_id, sector_id)
							  values (
								  (select id from(select sectors_map.id 
										  from sectors_map 
										  left join employees on employees.id = sectors_map.employee_id
										  where concat(employees.first_name, ' ', employees.last_name) like '`+empname+`' 
										  and sectors_map.sector_id = (select id from sectors where sector like '`+secitem+`'))temptable),
								  (select id from (select id 
										  from employees 
										  where concat(first_name, ' ', last_name) = '`+empname+`') temptbl), 
								  (select id from (select id 
										  from sectors 
										  where sector 
										  like '`+secitem+`') temptbl)
                  )
                  on duplicate key update sector_id = (select id from sectors 
                          where sector like '`+secitem+`');
                  DELETE sectors_map FROM sectors_map
                  LEFT JOIN employees on employees.id = sectors_map.employee_id
                  LEFT JOIN sectors on sectors.id = sectors_map.sector_id
                  WHERE CONCAT(first_name, ' ', last_name) LIKE '`+empname+`'
                  AND sector NOT IN `+result+`;`;

		  pool.query(queryString2, (err, results, fields) => {
			if(err) {
			  console.log('Failed to update employees (/updateemployee - multsec): ', err);
			  res.sendStatus(500);
			  return;
      }
      return;
		  });
    })

	}else if(ismultiple == false && empsec != ''){
    var result = "('"+empsec+"')";
		var queryString2 = `insert into sectors_map(id, employee_id, sector_id)
							values (
								(select id from(select sectors_map.id 
									from sectors_map 
									left join employees on employees.id = sectors_map.employee_id
									where concat(employees.first_name, ' ', employees.last_name) like '`+empname+`' 
									and sectors_map.sector_id = (select id from sectors where sector like '`+empsec+`'))temptable),
								(select id from (select id 
									from employees 
									where concat(first_name, ' ', last_name) = '`+empname+`') temptbl), 
								(select id from (select id 
									from sectors 
									where sector 
									like '`+empsec+`') temptbl)
							)
							on duplicate key update sector_id = (select id from sectors 
																where sector like '`+empsec+`');
              DELETE sectors_map FROM sectors_map
              LEFT JOIN employees on employees.id = sectors_map.employee_id
              LEFT JOIN sectors on sectors.id = sectors_map.sector_id
              WHERE CONCAT(first_name, ' ', last_name) LIKE '`+empname+`'
              AND sector NOT IN `+result+`;`;
		pool.query(queryString2, (err, results, fields) => {
			if(err) {
				console.log('Failed to update employees (/updateemployee - sngsec): ', err);
				res.sendStatus(500);
				return;
      }
			return;
		}); 
  }else if(empsec == ''){
    var queryString2 = `DELETE sectors_map FROM sectors_map
                        LEFT JOIN employees on employees.id = sectors_map.employee_id
                        LEFT JOIN sectors on sectors.id = sectors_map.sector_id
                        WHERE CONCAT(first_name, ' ', last_name) LIKE '`+empname+`';`;

    pool.query(queryString2, (err, results, fields) => {
      if(err) {
        console.log('Failed to update employees (/updateemployee - nosec): ', err);
        res.sendStatus(500);
        return;
      }
      return;
    }); 
  }
}); 

/* ------------------------------------------------------------ */

router.post('/newDate', (req, res, next) => {
    if (req.body.date === ""){
      req.session.passport.pWeek = "";
    }else{
      req.session.passport.pWeek = req.body.date;
      var week = req.session.passport.pWeek.split("-")
      var year = week[0];
      var weeknum = week[1].replace("W", "");
      var nextweek = year.concat("-W",parseInt(weeknum)+1);
      if(parseInt(weeknum) >= 52){
        var nextyear = parseInt(year)+1;
        req.session.passport.pWeek2 = nextyear.concat("-W01");
      }else{
        req.session.passport.pWeek2 = nextweek;
      }
    }
    res.redirect(req.get('referer'));
    next();
});

router.post('/landingFilter', (req, res, next) => {

  var userid;

  try{
    if(req.user.id === undefined ){
      userid = req.user;
    }else{
      userid = req.user.id;
    }
  }catch{
    userid = req.user;
  }

  console.log(userid);

  req.session.passport = {};
  req.session.passport.id = userid;

  if (req.body.pNumber == "Project_Number"){
    req.session.passport.fnum = "\'%\'";
  }else if (req.body.pNumber === ""){
    req.session.passport.fnum = "\'%\'";
  }else{
    req.session.passport.fnum = "\'%"+req.body.pNumber+"%\'";
  }
  if (req.body.pManager == "Project_Manager"){
    req.session.passport.fman = "\'%\'";
  }else if (req.body.pManager === ""){
    req.session.passport.fman = "\'%\'";
  }else{
    req.session.passport.fman = "\'%"+req.body.pManager+"%\'";
  }
  if (req.body.pDiscipline == "All_Disciplines"){
    req.session.passport.fdis = "\'%\'";
  }else if (req.body.pDiscipline === ""){
    req.session.passport.fdis = "\'%\'";
  }else{
    req.session.passport.fdis = "\'%"+req.body.pDiscipline+"%\'";
  } 
  if (req.body.pOffice === ""){
    req.session.passport.foff = "\'%\'";
  }else if(req.body.pOffice == "All_Offices"){
    req.session.passport.foff = "\'%\'";
  }else{
    req.session.passport.foff = "\'%"+req.body.pOffice+"%\'";
  } 
  if (req.session.passport.fnum === "\'%\'" && req.fman === "\'%\'" && req.fdis === "\'%\'" && req.foff === "\'%\'"){
    req.session.passport.showStart = true;
  }else{
    req.session.passport.showStart = false; 
  }
  if (req.body.eDiscipline == "All_Disciplines"){
    req.session.passport.eDept = "\'%\'";
  }else if(req.body.eDiscipline ===""){
    req.session.passport.eDept = "\'%\'"; 
  }else{
    req.session.passport.eDept = "\'%"+req.body.eDiscipline+"%\'";
  }
  if (req.body.eLocation == "All_Locations"){
    req.session.passport.eOff = "\'%\'";
  }else if (req.body.eLocation ===""){
    req.session.passport.eOff = "\'%\'";
  }else{
    req.session.passport.eOff = "\'%"+req.body.eLocation+"%\'";
  } 
/*   ---------------------- */
  if (req.body.eSector == "All_Sectors"){
    req.session.passport.eSec = "\'%\'";
  }else if (req.body.eSector === ""){
    req.session.passport.eSec = "\'%\'";
  }else if(Array.isArray(req.body.eSector)){
    var arr = req.body.eSector;
    var strarr = JSON.stringify(arr);
    var result = strarr.replace('[', '(');
    result = result.replace(']', ')');
    result = result.replace(/"/g, "'");
    req.session.passport.eSec = result;
  }else{
    req.session.passport.eSec = "('"+req.body.eSector+"')";
  } 
/*   ---------------------- */
  if (req.body.week === ""){
    req.session.passport.pWeek = "";
  }else{
    req.session.passport.pWeek = req.body.week;
    var week = req.session.passport.pWeek.split("-")
    var year = week[0];
    var weeknum = week[1].replace("W", "");
    var nextweek = year.concat("-W",parseInt(weeknum)+1); 
    if(parseInt(weeknum) >= 52){
      var nextyear = parseInt(year)+1;
      req.session.passport.pWeek2 = nextyear.concat("-W01");
    }else{
      req.session.passport.pWeek2 = nextweek;
    }
  }

  req.session.passport.headerfields = [];
  req.session.passport.totalsarray = [];
  req.session.passport.highlighted = [];
  req.session.passport.employeeName = "";

  pman = req.body.pManager
  if(pman == ""){
 /*    pman = "Project_Manager"; */
    pman = null;
  }
  pdisc = req.body.pDiscipline
  if(pdisc == ""){
    pdisc = null;
  }
  poffice = req.body.pOffice
  if(poffice == ""){
    poffice = null;
  }
  pnum = req.body.pNumber
  if(pnum == ""){
/*     pnum = "Project_Number"; */
    pnum = null;
  }
  edisc = req.body.eDiscipline;
  eoffice = req.body.eLocation;
  week = req.body.week;
/* ----------------------------------- */
  eSecArray = req.body.eSector;
  var eSec;
  if(Array.isArray(eSecArray)){
    eSec = eSecArray.join();
  }else{
    eSec = eSecArray;
  }
/* ----------------------------------- */
  
  const queryString = "UPDATE resourcemanager_user SET filter_pman=?, filter_poffice=?, filter_pdisc=?, filter_pnum=?, filter_eoffice=?, filter_edisc=?, filter_sector=?, filter_week=? WHERE user_id=?";
  pool.query(queryString,[pman, poffice, pdisc, pnum, eoffice, edisc, eSec, week, userid],(err, rows, fields) => {
    if (err) {
      console.log('failed query request within landingFilter ' + err);
      res.sendStatus(500); 
      return;
    }
    else{
      res.redirect('weeklymatrix'); 
      next();
    }
  });
});

router.get('/dateRange', (req, res) => {
  res.status(200).send(req.session.passport.pWeek);
});
router.get('/dateRange2', (req, res) => {
  res.status(200).send(req.session.passport.pWeek2);
});

module.exports = router;


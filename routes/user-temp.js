const express = require('express')
  , bodyParser = require('body-parser')
  , router = express.Router()
  , pool = require('./databaseConnection.js');

router.use(bodyParser.json());
var _ = require('lodash');

//------- filter params
var  showStart = true;
var  fnum = "\'%\'";
var  fman = "\'%\'";
var  fdis = "\'%\'";
var  foff = "\'%\'";
var  eDept = "\'%\'";
var  eOff = "\'%\'";
var  pWeek = "";
var  pWeek2 = "";
var  headers = [];
var  totalsarray = [];
var  highlighted = [];
var  employeeName = "";
//-------

router.get('/messages', (req, res) => {
    res.end();
});

router.get('/users', (req, res) => {
    const queryString = 'SELECT * FROM testTable';
    pool.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log('failed query request ' + err);
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
        console.log('failed query request ' + err);
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
  var standard = ['project_phases.id', 'project_title', 'job_number', 'title', 'start', 'end', 'completion', 'hours_budgeted'];
  var columns = standard.concat(headers);
  if (showStart == false ){
    const queryStringWdate = 'SELECT '+columns+' FROM project_phases LEFT JOIN projects on projects.id = project_phases.project_id LEFT JOIN hourmap on hourmap.PhaseID = project_phases.id LEFT JOIN schedule ON schedule.id = hourmap.ScheduleID LEFT JOIN employees on employees.id = projects.project_manager LEFT JOIN offices ON offices.id = employees.office_id WHERE (concat(employees.first_name, " ", employees.last_name) LIKE '+fman+') AND (projects.job_number LIKE '+fnum+') AND (project_phases.Department LIKE '+fdis+') AND (project_phases.Department LIKE '+foff+') AND (project_phases.Phase_Status = "Active") AND (hourmap.year_week = \"'+pWeek+'\" or hourmap.year_week is Null) ORDER BY job_number, phase_order';
    pool.query(queryStringWdate, (err, rows, fields) => {
      if (err) {
        console.log('failed query request ' + err);
        res.sendStatus(500);
        return;
      }
      var titles = [];
      for(var i=0; i<rows.length; i++){
        var title = rows[i].project_title;
        if (titles.includes(title)===false){
          titles.push(rows[i].project_title);
          highlighted.push(i);
        }else{
        }  
        i++;
      }
      res.json(rows);
    });
  }
});

router.get('/employee_data', (req, res) => {
  var standard = ['Project_Description', 'Ajera_Project_ID', 'title', 'start', 'end', 'completion', 'hours_budgeted'];
  var columns = standard.concat(employeeName);
  if (showStart == false ){
    const queryString = 'SELECT '+columns+' from hourmap left join project_phases on project_phases.id = hourmap.PhaseID where '+employeeName+' <> "" AND (year_week = \"'+pWeek+'\")';
    pool.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log('failed query request ' + err);
        console.log(queryString);
        res.sendStatus(500);
        return;
      }
      var titles = [];
      for(var i=0; i<rows.length; i++){
        var title = rows[i].project_title;
        if (titles.includes(title)===false){
          titles.push(rows[i].project_title);
          highlighted.push(i);
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
  const queryString = 'SELECT concat(first_name, "_", last_name) as fullname FROM employees where concat(first_name, " ", last_name) LIKE '+name;
  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request ' + err);
      res.sendStatus(500);
      return;
    }
    var fullname = rows[0].fullname; 
    employeeName = fullname;
    res.send(employeeName);
  });
  
}); 

router.get('/ftes', (req, res) => {
  if (showStart == false ){
    /* const queryString = 'SELECT sum(Hours_Budgeted) FROM project_phases WHERE ' */
    const queryString = 'SELECT project_phases.id, title, start, end, Hours_Budgeted, Hours_Worked, Hours_Remaining FROM project_phases LEFT JOIN projects on projects.id = project_phases.project_id LEFT JOIN hourmap on hourmap.PhaseID = project_phases.id LEFT JOIN schedule ON schedule.id = hourmap.ScheduleID LEFT JOIN employees on employees.id = projects.project_manager LEFT JOIN offices ON offices.id = employees.office_id WHERE (concat(employees.first_name, " ", employees.last_name) LIKE '+fman+') AND (projects.job_number LIKE '+fnum+') AND (project_phases.Department LIKE '+fdis+') AND (project_phases.Department LIKE '+foff+') AND (project_phases.Phase_Status = "Active") AND (hourmap.year_week = \"'+pWeek+'\" or hourmap.year_week is Null)'; 
    pool.query(queryString, (err, rows, fields) => {
      if (err) {
        console.log('failed query request ' + err);
        res.sendStatus(500);
        return;
      }
      res.json(rows);
    });
  }
});

router.get('/highlight', (req, res) => {
  const projTitles = Object.assign({}, highlighted);
  console.log(projTitles);
  res.json(projTitles);
});

router.get('/searchHeader', (req, res) => {
  res.send(employeeName);
});

router.get('/headers', (req, res) => {
  const queryString = 'SELECT CONCAT(first_name," ", last_name) as Employee FROM employees LEFT JOIN divisions on divisions.id = employees.division_id LEFT JOIN offices on offices.id = employees.office_id WHERE (deleted_at is null) AND (divisions.name LIKE '+eDept+' or divisions.name is Null) AND (offices.name LIKE '+eOff+' or offices.name is Null) GROUP BY Employee';
  //const queryString = 'SELECT distinct(Employee) FROM employees';
  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request ' + err);
      res.sendStatus(500);
      return;
    }
    if(headers.length>0){
      headers = [];
    }
    var tempheaders = [];
    const emphead = rows.map((row) => {
      var fixname = row.Employee.replace(/ /g, "_");
      var stripname = fixname.replace(".", "");
      tempheaders.push(stripname);
      return {name: row.Employee} 
    });
    headers = tempheaders;
    res.json(emphead);
  });
});

router.get('/employees', (req, res) => {
  const queryString = 'SELECT concat(first_name, " ", last_name) FROM employees WHERE deleted_at is null';
  pool.query(queryString, (err, rows, fields) => {
    if (err) {
      console.log('failed query request ' + err);
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
      console.log('failed query request ' + err);
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
  const queryString = 'SELECT schedule.id FROM schedule JOIN employees on employees.id = schedule.employee_id WHERE CONCAT(employees.first_name, " ", employees.last_name)=? AND schedule.project_phase=? AND schedule.year_week=?';
  pool.query(queryString,[schedule[0].name, schedule[0].phaseName, schedule[0].week],(err, rows, fields) => {
    if (err) {
      console.log('failed query request ' + err);
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
  headers.forEach(function(item){
    var name = item.replace("'", ""); 
    name = name.replace(".", "");
    newheaders.push('SUM('+name+') as '+name);
  }) 
  const queryString = 'SELECT '+newheaders+' FROM hourmap where year_week = ?';
  pool.query(queryString, [pWeek], (err, rows, fields) => {
    if (err) {
      console.log('failed query request ' + err);
      res.sendStatus(500);
      return;
    }
    var returnvalue = {};
    for (name in headers){
      name = headers[name];
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
      console.log('failed query request ' + err);
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
  var projid = empschedule.pid;
  var yearweek = empschedule.week;
  const queryString = 'UPDATE hourmap SET `'+ename+'`='+ehours+' WHERE hourmap.id = (SELECT id FROM (SELECT id FROM hourmap WHERE ProjectID='+projid+' AND (PhaseID='+phaseid+') AND (year_week = \"'+yearweek+'\")) temptbl)';
  pool.query(queryString,(err, results, fields) => {
    if(err) {
      console.log('Failed to update hourmap: ', err);
      res.sendStatus(500);
      return;
    }
    console.log(queryString);
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
  const queryStringInsert = 'INSERT INTO schedule (employee_id, project_id, phase_id, project_phase, year_week, hours) VALUES((SELECT id FROM employees WHERE concat(first_name, " ", last_name)=?),(SELECT MIN(projects.id) FROM projects LEFT JOIN project_phases on project_phases.project_id = projects.id WHERE projects.job_number = ? AND project_phases.title = ?),?,?,?,?);SELECT LAST_INSERT_ID();';
  const queryStringUpdate = 'UPDATE schedule SET hours=? WHERE id=?';
  var schedule = req.body.schedule;
  console.log(schedule);
  var completed = 0;
  schedule.forEach(function(item) {
    var employeename = item.name;
    if (item.sid == "NAN"){
        pool.query(queryStringInsert, [employeename, item.pnum, item.phaseName, item.phid, item.phaseName, item.week, item.hours], (err, results, body) => {
          if (!err && res.statusCode == 200) {
            completed = completed + 1;
            onComplete(results); //attempt completion
        }
        if (err){
          console.log('Failed to submit hours: ', err);
        }
        });
    }else{
      pool.query(queryStringUpdate, [item.hours, item.sid], (err, results, body) => {
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
router.post('/projectID', (req, res) => {
  var schedule = req.body.schedule;
  const queryString = 'SELECT projects.id FROM projects LEFT JOIN project_phases on project_phases.project_id = projects.id WHERE projects.job_number = ? AND project_phases.title LIKE ?';
  pool.query(queryString,[schedule[0].pnum, schedule[0].phaseName],(err, rows, fields) => {
    if (err) {
      console.log('failed query request ' + err);
      res.sendStatus(500); 
      return;
    }
    else{
      res.json(rows[0].id);
    }
  });
});
router.post('/phaseID', (req, res) => {
  var schedule = req.body.schedule;
  const queryString = 'SELECT project_phases.id FROM project_phases LEFT JOIN projects on projects.id = project_phases.project_id WHERE projects.job_number = ? AND project_phases.title LIKE ?';
  pool.query(queryString,[schedule[0].pnum, schedule[0].phaseName],(err, rows, fields) => {
    if (err) {
      console.log('failed query request ' + err);
      res.sendStatus(500); 
      return;
    }
    else{
      res.json(rows[0].id);
    }
  });
});

router.post('/newDate', (req, res) => {
    if (req.body.date === ""){
      pWeek = "";
    }else{
      pWeek = req.body.date;
      var week = pWeek.split("-")
      var year = week[0];
      var weeknum = week[1].replace("W", "");
      var nextweek = year.concat("-W",parseInt(weeknum)+1);
      if(parseInt(weeknum) >= 52){
        var nextyear = parseInt(year)+1;
        pWeek2 = nextyear.concat("-W01");
      }else{
        pWeek2 = nextweek;
      }
    }

});

router.post('/landingFilter', (req, res) => {
  if (req.body.pNumber === ""){
    fnum = "\'%\'";
  }else{
    fnum = "\'%"+req.body.pNumber+"%\'";
  }
  if (req.body.pManager === ""){
    fman = "\'%\'";
  }else{
    fman = "\'%"+req.body.pManager+"%\'";
  }
  if (req.body.pDiscipline === ""){
    fdis = "\'%\'";
  }else{
    fdis = "\'%"+req.body.pDiscipline+"%\'";
  } 
  if (req.body.pOffice === ""){
    foff = "\'%\'";
  }else if(req.body.pOffice == "All"){
    foff = "\'%\'";
  }else{
    foff = "\'%"+req.body.pOffice+"%\'";
  } 
  if (fnum === "\'%\'" && fman === "\'%\'" && fdis === "\'%\'" && fOff === "\'%\'"){
    showStart = true;
  }else{
    showStart = false; 
  }
  if (req.body.eDiscipline == "All"){
    eDept = "\'%\'";
  }else if(req.body.eDiscipline ===""){
    eDept = "\'%\'"; 
  }else{
    eDept = "\'%"+req.body.eDiscipline+"%\'";
  }
  if (req.body.eLocation == "All"){
    eOff = "\'%\'";
  }else if (req.body.eLocation ===""){
    eOff = "\'%\'";
  }else{
    eOff = "\'%"+req.body.eLocation+"%\'";
  } 
  if (req.body.week === ""){
    pWeek = "";
  }else{
    pWeek = req.body.week;
    var week = pWeek.split("-")
    var year = week[0];
    var weeknum = week[1].replace("W", "");
    var nextweek = year.concat("-W",parseInt(weeknum)+1); 
    if(parseInt(weeknum) >= 52){
      var nextyear = parseInt(year)+1;
      pWeek2 = nextyear.concat("-W01");
    }else{
      pWeek2 = nextweek;
    }
  }

  res.redirect('/schedule.html'); 
});

router.get('/dateRange', (req, res) => {
  res.status(200).send(pWeek);
});
router.get('/dateRange2', (req, res) => {
  res.status(200).send(pWeek2);
});

module.exports = router;


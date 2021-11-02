const express = require('express')
  , bodyParser = require('body-parser')
  , router = express.Router()
  , pool = require('./databaseConnection.js');
  
router.use(bodyParser.json());

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

'use strict';

var express = require('express');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
require('dotenv').config();

var cors = require('cors');

var app = express();

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

/** this project needs a db !! **/ 
mongoose.connect(process.env.MLAB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

let db = mongoose.connection;

// See https://medium.com/@vsvaibhav2016/best-practice-of-mongoose-connection-with-mongodb-c470608483f0
// successfully connected
db.on('connected', () => {
  console.log('Mongoose default connection is open.');
});

// on error
db.on('error', err => {
  console.log('Mongoose default connection has occured ' + err + ' error');
});

// disconnected
db.on('disconnected', () => {
  console.log('Mongoose default connection is dicsonnected');
});

// process end
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log("Mongoose default connection is disconnected due to application termination");
    process.exit(0);
  });
});

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(3000, function () {
  console.log('listening on 3000');
});

let userSchema = new mongoose.Schema({
  username: String,
  _id: String,
  count: Number,
  log: []
});

const User = mongoose.model('User', userSchema);

app.post('/api/exercise/new-user', (req, res) => {
  let username = req.body.username;
  let _id = shortid.generate();
  let user = new User({username, _id, count: 0, log: []});
  user.save(err => {
    if (err) return console.log(err);
    res.send({username, _id});
  });
});

// formatDate function from https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd
function formatDate() {
  var d = new Date(),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}


app.post('/api/exercise/add', (req, res) => {
  let _id = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date || formatDate();
  db.collection('users').findOneAndUpdate({_id}, {$inc: {count: 1}, "$push": {log: {description, duration, date}}}, {new: true}, (err, data) => {
    if (err) return console.log(err);
    res.send({username: data.username, _id, description, duration, date});
  });
});

app.get('/api/exercise/users', (req, res) => {
  db.collection('users').find({}).toArray((err, data) => {
    if (err) return console.log(err);
    res.send(data);
  });
});

app.get('/api/exercise/log?', (req, res) => {
  let _id = req.query.userId;
  let from = req.query.from;
  let to = req.query.to;
  db.collection('users').findOne({_id}, (err, data) => {
    res.send(data);
  });
});

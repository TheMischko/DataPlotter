const express = require('express');
const path = require('path');
require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const logger = require('morgan');
const MongoClient = require('mongodb');
const mongoose = require('mongoose');

const indexRouter = require('./routes/index');
const zoomRouter = require('./routes/zoomRouter');
const viewRouter = require('./routes/viewRouter');
const fileRouter = require('./routes/fileRouter');

const app = express();

const dbURI = process.env.DB_URI;
mongoose.connect(
  dbURI,
  {useNewUrlParser: true, useUnifiedTopology: true}
  ).then();
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));

app.use(fileUpload({
  createParentPath: true
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/zooms', zoomRouter);
app.use('/views', viewRouter);
app.use('/files', fileRouter);

module.exports = app;

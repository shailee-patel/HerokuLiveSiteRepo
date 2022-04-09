// import 3rd party modules to support express server
import createError from 'http-errors';
import express, { NextFunction }  from'express';
import path  from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

// module to connect to mongodb
import mongoose from 'mongoose';

// modules for authentication
import session from 'express-session'; // cookie-based authentication
import passport, { use } from 'passport'; // authetication middleware
import passportLocal from 'passport-local'; // authetication strategy (username / password)
import flash from 'connect-flash'; // auth messaging and error management

// authetication objects
let localStrategy = passportLocal.Strategy; // alias

// import a User Model
import User from '../Models/user';

// App configuration

// Import routers
import indexRouter from '../Routes/index';
import usersRouter from '../Routes/users';

const app = express();

// db configuration
import * as DBConfig from './db';
mongoose.connect(DBConfig.RemoteURI);

const db = mongoose.connection; // alias for mongoose.connection
db.on("error", function()
{
  console.error("Connection error");
});
db.once("open", function()
{
  console.log(`Connected to Mongodb at ${DBConfig.HostName}`);
});

// view engine setup
app.set('views', path.join(__dirname, '../Views'));
app.set('view engine', 'ejs');

// add middleware functions
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../../Client')));
app.use(express.static(path.join(__dirname, '../../node_modules')));

// setup express session
app.use(session({
  secret: DBConfig.SessionSecret,
  saveUninitialized: false,
  resave: false
}));

// initialize flash middleware
app.use(flash());

// initialize passport middleware
app.use(passport.initialize());
app.use(passport.session());

// implement an Auth Strategy
passport.use(User.createStrategy());

// serialize and deserialize user data
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) 
{
  next(createError(404));
});

// error handler
app.use(function(err: createError.HttpError, req: express.Request, 
  res: express.Response, next: NextFunction) 
{
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
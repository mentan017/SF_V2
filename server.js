//Import modules
const cookieParser = require('cookie-parser');
const express = require('express');
const fs = require('fs');
const https = require('https');
const mongoose = require('mongoose');
require('dotenv').config();

//Import routes
const AuthRouter = require('./routes/auth.js');
const ProfileRouter = require('./routes/profile.js');
const RolesRouter = require('./routes/roles.js');
const TasksRouter = require('./routes/tasks.js');
const TeamRouter = require('./routes/teams.js');
const UserRouter = require('./routes/user.js');

//Import MongoDB models
const CookieModel = require('./models/cookie.js');
const UserModel = require('./models/user.js');

//Import SSL certificate
const sslOptions = {
    key: fs.readFileSync('./cert/server.key'),
    cert: fs.readFileSync('./cert/server.crt')
}

//Connect to MongoDB database
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.PROJECT_NAME}`);
var db = mongoose.connection;

//Global variables
const app = express();
const server = https.createServer(sslOptions, app);
const homeDir = __dirname;

//App configuration
app.use(express.static(__dirname + '/client'));
app.use(express.json());
app.use(cookieParser());

//Middleware
async function checkAuth(req, res, next){
    try{
        //Check for cookies
        if(req.cookies?.SID){
            //Check cookie validity
            req.AuthedUser = (await CookieModel.findOne({UUID: req.cookies.SID}))?.UserID;
            if(req.AuthedUser){
                next();
            }else{
                res.status(401).clearCookie("SID").redirect('/auth/');
            }
        }else{
            res.status(401).redirect('/auth/');
        }    
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
}

//Routes

//GET routes
app.get('/', checkAuth, async function(req, res, next){
    res.status(200).sendFile(`${homeDir}/client/main/index.html`);
});

//Connect routes
app.use('/auth', AuthRouter);
app.use('/profiles', ProfileRouter);
app.use('/roles', RolesRouter);
app.use('/tasks', TasksRouter);
app.use('/team', TeamRouter);
app.use('/user', UserRouter);

//Start server
server.listen(process.env.PORT);
console.log(`${process.env.PROJECT_NAME} listening on port: ${process.env.PORT}`);
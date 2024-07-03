//Import modules
const bcrypt = require('bcrypt');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

//Import MongoDB models
const CookieModel = require('../models/cookie.js');
const UserModel = require('../models/user.js');

//Connect to MongoDB database
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.PROJECT_NAME}`);
var db = mongoose.connection;

//Global variables
const router = express.Router();
const homeDir = path.join(__dirname, '..');

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
router.get('/', function(req, res){
    res.status(301).redirect('/user/dashboard');
});
router.get('/dashboard', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            res.status(200).sendFile(`${homeDir}/client/users/dashboard/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//POST routes
router.post('/get-user-navigation', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        var navigation = `<div class="nav-img"><img src="/images/sf24_logo_black_no_bg_256.png" alt="Springfest 2024 logo"></div>
        <a href="/"><div>Home</div></a>`;
        if(user.CanManageConfiguration) navigation += `<a href="#"><div>Configuration</div></a>`;
        if(user.CanAccessMeetings || user.CanManageAllMeetings) navigation += `<a href="#"><div>Meetings</div></a>`;
        if(user.CanAccessTeams || user.CanManageAllTeams) navigation += `<a href="/team/list-teams"><div>Teams</div></a>`;
        if(user.CanUseTools) navigation += `<a href="#"><div>Tools</div></a>`;
        if(user.CanManageAllUsers) navigation += `<a href="/user/dashboard"><div>Users</div></a>`;
        navigation += `<a href="#"><div>Help</div></a>`;
        res.status(200).send({Navigation: navigation});
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/user-permissions', checkAuth, async function(req, res, next){
    try{
        //TODO Give general information about user permissions (access to routes, management rights, ...)
        var user = await UserModel.findById(req.AuthedUser);
        if(user){
            var response = {
                Name: user.Name,
                Nickname: user.Nickname,
                Email: user.Email,
                TeamsRouteAccess: false,
                UserRouteAccess: false,
                ConfigurationRouteAccess: false,
                //TODO add other routes access
                ManageAllTeams: user.CanManageAllTeams,
                ManageAllUsers: user.CanManageAllUsers,
            }
            //TODO go through all user profiles to check for permissions (teams access)
            if(response.ManageAllTeams) response.TeamsRouteAccess = true;
            if(response.ManageAllUsers) response.UserRouteAccess = true;

            res.status(200).send(response);
        }else{
            res.status(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Export router
module.exports = router;
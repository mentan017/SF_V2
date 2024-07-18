//Import modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

//Import MongoDB models
const CookieModel = require('../models/cookie.js');
const ProfileModel = require('../models/profile.js');
const RoleModel = require('../models/role.js');
const TeamModel = require('../models/team.js');
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

router.get('/', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        res.status(200).sendFile(`${homeDir}/client/roles/role/index.html`);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//PUT routes

router.put('/new-role', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        var Team = await TeamModel.findOne({UUID: req.body?.TeamUUID});
        if(Team){
            var NewRole = new RoleModel({
                Name: req.body?.RoleName,
                Team: Team._id,
                TShirtText: `${Team.Name} ${req.body?.RoleName}`
            });
            await NewRole.save();
            Team.Roles.push(NewRole._id);
            await Team.save();
            res.sendStatus(200);
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
})

//Export router
module.exports = router;
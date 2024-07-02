//Import modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

//Import MongoDB models
const CookieModel = require('../models/cookie.js');
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

router.get('/teams', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user.CanManageAllTeams){
            res.status(200).sendFile(`${homeDir}/client/team/teams/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/team/:uuid', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        var team = await TeamModel.find({UUID: req.params?.uuid});
        var userProfiles = []; //TODO query all profiles linked to the user and check if one of the profiles has access to the team
        var CanAccessTeam = false;
        if(user.CanManageAllTeams) CanAccessTeam = true;
        if(CanAccessTeam){
            res.status(200).sendFile(`${homeDir}/client/team/team/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(200);
    }
});

//POST routes

router.post('/list-teams', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        var teams = [];
        var response = [];
        if(user.CanManageAllTeams){
            teams = await TeamModel.find({}, null, {sort: {Name: 1}});
        }else{
            //TODO go through all the profiles and get the teams from those profiles that can be accessed
        }
        for(var i=0; i<teams.length; i++){
            var Members = await GetTeamMembers(teams[i]._id);
            response.push({
                Name: teams[i].Name,
                UUID: teams[i].UUID,
                Managers: GetMembersOfRole("Manager", Members),
                Coaches: GetMembersOfRole("Coach", Members),
                TotalMembers: Members.length
            })
        }
        res.status(200).send(response);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//PUT routes

router.put('/create-team', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(req.body?.TeamName && user.CanManageAllTeams){
            //TODO Create default roles: Manager, Member, Coach
            var roles = [];
            var team = new TeamModel({
                Name: req.body.TeamName,
                UUID: uuidv4(),
                Roles: roles
            });
            await team.save();
            res.status(200).send({UUID: team.UUID});
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Functions

async function GetTeamMembers(teamId){
    try{
        var team = await TeamModel.findById(teamId);
        var profiles = [];
        //TODO Get all the users and sort them by their role
        return profiles
    }catch(e){
        console.log(0);
        return [];
    }
}
function GetMembersOfRole(Role, Members){
    var members = 0;
    for(var i=0; i<Members.length; i++){
        if(Members[i].Role == Role) members++;
    }
    return members;
}

//Export router
module.exports = router;
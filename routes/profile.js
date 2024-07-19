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

//GET routes

router.get('/:profileID', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        res.status(200).sendFile(`${homeDir}/client/profiles/profile/index.html`);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//POST routes

router.post('/get-profile-info', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        var profile = await ProfileModel.findById(req.body?.ProfileID);
        if(profile){
            var team = await TeamModel.findById(profile.Team);
            var response = {
                Name: profile.Name,
                Email: profile.Email,
                Year: (await UserModel.findById(profile.User)).Year,
                TeamUUID: team.UUID,
                TeamName: team.Name,
                Role: profile.Role,
                Roles: [],
                CanManageSubTeams: profile.CanManageSubTeams,
                CanManageTeam: profile.CanManageTeam,
                CanManageTeamConfiguration: profile.CanManageTeamConfiguration,
                GetsTShirt: profile.GetsTShirt,
                TShirtSize: profile.TShirtSize,
                TShirtText: profile.TShirtText
            }
            var rolesRaw = await RoleModel.find({Team: team._id}, null,{sort: {Name: 1}});
            for(var i=0; i<rolesRaw.length; i++){
                response.Roles.push({
                    Name: rolesRaw[i].Name,
                    ID: rolesRaw[i]._id
                });
            }
            res.status(200).send(response);
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e)
        res.sendStatus(500);
    }
});
router.post('/update-profile', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        var request = req.body;
        var profile = await ProfileModel.findById(request.ProfileID);
        if(profile){
            if(request.Role != profile.Role.toString()){
                var role = await RoleModel.findById(request.Role);
                profile.Role = request.Role;
                profile.TShirtText = role.TShirtText;
                profile.GetsTShirt = role.GetsTShirt;
                profile.CanManageSubTeams = role.CanManageSubTeams;
                profile.CanManageTeam = role.CanManageTeam;
                profile.CanManageTeamConfiguration = role.CanManageTeamConfiguration;
            }else{
                profile.CanManageSubTeams = request.CanManageSubTeams || false;
                profile.CanManageTeam = request.CanManageTeam || false;
                profile.CanManageTeamConfiguration = request.CanManageTeamConfiguration || false;
                profile.GetsTShirt = request.GetsTShirt || false;
                profile.TShirtText = request.TShirtText;
            }
            profile.TShirtSize = request.TShirtSize;
            await profile.save();
            res.sendStatus(200);
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//DELETE routes

router.delete('/remove', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        var profile = await ProfileModel.findByIdAndDelete(req.body?.ProfileID);
        if(profile){
            var team = await TeamModel.findById(profile.Team);
            //TODO remove from subteams
            var UpdatedUsers = [];
            for(var i=0; i<team.Users.length; i++){
                if(team.Users[i].toString() != profile._id.toString()) UpdatedUsers.push(team.Users[i]);
            }
            team.Users = UpdatedUsers;
            await team.save();
            res.sendStatus(200);
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Export router
module.exports = router;
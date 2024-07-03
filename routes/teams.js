//Import modules
const csv = require('csvtojson');
const excelToJson = require('convert-excel-to-json');
const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const {v4: uuidv4} = require('uuid');
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

router.get('/list-teams', checkAuth, async function(req, res, next){
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
            var roles = await CreateDefaultRoles();
            var team = new TeamModel({
                Name: req.body.TeamName,
                UUID: uuidv4(),
                Roles: roles
            });
            await team.save();
            res.status(200).send({UUID: team.UUID});
            UpdateRoles(roles, team._id, team.Name);
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

router.put('/upload-batch-users/:teamUUID', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        var team = await TeamModel.findOne({UUID: req.params?.teamUUID});
        var form = new formidable.IncomingForm();
        form.multiple = false;
        form.parse(req, async function(err, fields, files){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                var originalFileName = files.files[0].originalFilename;
                var filePath = await SaveFile(files.files[0].filepath, `${uuidv4()}`);
                if(!filePath) res.sendStatus(500);
                else{
                    var EmailFieldColumn = originalFileName[0].toUpperCase();
                    var TShirtSizeFieldColumn = originalFileName[1].toUpperCase();
                    //Assign the member role or the first role to the new members
                    var defaultRole = "";
                    var roles = await RoleModel.find({Team: team._id});
                    for(var i=0; i<roles.length; i++){
                        defaultRole = roles[i]._id;
                        if(roles[i].Name == "Member") i=roles.length+1;
                    }
                    var jsonData = excelToJson({sourceFile: filePath}).Sheet1;
                    for(var i=1; i<jsonData.length; i++){
                        AddTeamUser(team._id, jsonData[i][EmailFieldColumn], jsonData[i][TShirtSizeFieldColumn], defaultRole);
                    }
                    fs.unlinkSync(filePath);
                }
                res.sendStatus(200);
            }
        });
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Functions

async function CreateDefaultRoles(){
    var memberRole = new RoleModel({
        Name: "Member",
    });
    var managerRole = new RoleModel({
        Name: "Manager",
        OverridesTShirtTeamPriority: true,
        CanManageSubTeams: true,
        CanManageTeam: true
    });
    var coachRole = new RoleModel({
        Name: "Coach",
        OverridesTShirtTeamPriority: true,
        CanManageSubTeams: true,
        CanManageTeam: true
    });
    await memberRole.save();
    await managerRole.save();
    await coachRole.save();
    return([memberRole._id, managerRole._id, coachRole._id]);
}
async function UpdateRoles(roles, teamId, teamName){
    for(var i=0; i<roles.length; i++){
        var role = await RoleModel.findById(roles[i]);
        role.Team = teamId;
        role.TShirtText = `${teamName} ${role.Name}`;
        await role.save();
    }
}
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
async function SaveFile(filepath, filename){
    try{
        fs.copyFileSync(filepath, `${homeDir}/data/${filename}`);
        return(`${homeDir}/data/${filename}`);
    }catch(e){
        console.log(e);
        return 0;
    }
}
async function AddTeamUser(teamID, email, tShirtSize, roleID){
    if(!(await ProfileModel.findOne({Team: teamID, Email: email}))){
        if(!(await UserModel.findOne({Email: email}))){
            //Create a new user and profile
            var allTeachers = await csv().fromFile(`${homeDir}/resources/${process.env.TEACHERSFILE}`);
            var allStudents = await csv().fromFile(`${homeDir}/resources/${process.env.STUDENTSFILE}`);
            var allSchool = [];
            for(var i=0; i<allStudents.length; i++){
                allSchool.push({
                    Name: allStudents[i].displayName.split(" (IXL")[0],
                    Email: allStudents[i].userPrincipalName,
                    Year: allStudents[i].displayName.substring(((allStudents[i].displayName).length - 5, (allStudents[i].displayName).length - 4))
                });
            }
            for(var i=0; i<allTeachers.length; i++){
                allSchool.push({
                    Name: allTeachers[i].displayName,
                    Email: allTeachers[i].userPrincipalName,
                    Year: "Teacher"
                });
            }
            for(var i=0; i<allSchool.length; i++){
                if(allSchool[i].Email == email){
                    var newUser = new UserModel({
                        Email: email,
                        Name: allSchool[i].Name,
                        Nickname: email.split("@")[0],
                        Password: "",
                        TShirtSize: tShirtSize,
                        Year: allStudents[i].Year
                    });
                    await newUser.save();
                    i=allSchool.length;
                }
            }
        }
        //Create the profile
        var role = await RoleModel.findById(roleID);
        var user = await UserModel.findOne({Email: email});
        var newProfile = new ProfileModel({
            Name: user.Name,
            Email: email,
            GetsTShirt: true,
            Role: roleID,
            Team: teamID,
            TShirtSize: tShirtSize,
            TShirtText: role.TShirtText,
            User: user._id,
            CanManageSubTeams: role.CanManageSubTeams,
            CanManageTeam: role.CanManageTeam
        });
        await newProfile.save();
        var team = await TeamModel.findById(teamID);
        team.Users.push(newProfile._id);
        await team.save();
    }
}

//Export router
module.exports = router;
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
            res.status(307).redirect('/auth/');
        }    
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
}

//Routes

//GET routes

router.get('/list-teams', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user.CanManageAllTeams || user.CanAccessTeams){
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
        var team = await TeamModel.findOne({UUID: req.params?.uuid});
        var userProfile = await ProfileModel.findOne({User: user._id, Team: team._id});
        var CanAccessTeam = false;
        if(userProfile?.CanManageTeam == true) CanAccessTeam = true;
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

router.post('/list-roles', checkAuth, async function(req, res, next){
    try{
        if(CheckPermissions('list-roles', req.AuthedUser, req.body?.teamUUID)){
            var team = await TeamModel.findOne({UUID: req.body?.teamUUID});
            var roles = [];
            for(var i=0; i<team.Roles.length; i++){
                var role = await RoleModel.findById(team.Roles[i]);
                roles.push({
                    Name: role.Name,
                    ID: role._id,
                    MembersWithRole: (await ProfileModel.countDocuments({Role: role._id}))
                });
            }
            res.status(200).send(roles);
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/list-teams', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        var teams = [];
        var response = [];
        if(user.CanManageAllTeams){
            teams = await TeamModel.find({}, null, {sort: {Name: 1}});
        }else{
            var profiles = await ProfileModel.find({User: user._id});
            for(var i=0; i<profiles.length; i++){
                teams.push(await TeamModel.findById(profiles[i].Team));
            }
        }
        for(var i=0; i<teams.length; i++){
            response.push({
                Name: teams[i].Name,
                UUID: teams[i].UUID,
                Managers: await GetMembersOfRole("Manager", teams[i]._id),
                Coaches: await GetMembersOfRole("Coach", teams[i]._id),
                TotalMembers: teams[i].Users.length
            });
        }
        res.status(200).send(response);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/list-users', checkAuth, async function(req, res, next){
    try{
        if(CheckPermissions('list-users', req.AuthedUser, req.body?.teamUUID)){
            var team = await TeamModel.findOne({UUID: req.body?.teamUUID});
            if(team){
                var profilesRaw = await ProfileModel.find({Team: team._id}, null, {sort: {Name: 1}});
                var profiles = [];
                for(var i=0; i<profilesRaw.length; i++){
                    profiles.push({
                        Name: profilesRaw[i].Name,
                        Email: profilesRaw[i].Email,
                        Role: profilesRaw[i].Role,
                        TShirtSize: profilesRaw[i].TShirtSize,
                        GetsTShirt: profilesRaw[i].GetsTShirt,
                        ID: profilesRaw[i]._id,
                        Year: (await UserModel.findById(profilesRaw[i].User)).Year
                    });
                }
                res.status(200).send(profiles);
            }else{
                req.sendStatus(400);
            }    
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/team-info', checkAuth, async function(req, res, next){
    try{
        if(CheckPermissions('team-info', req.AuthedUser, req.body?.teamUUID)){
            var team = await TeamModel.findOne({UUID: req.body?.teamUUID});
            if(team){
                res.status(200).send({
                    TeamName: team.Name,
                    TShirtColorName: team.TShirtColorName,
                    TShirtColorHEX: team.TShirtColorHEX
                });
            }else{
                res.sendStatus(400);
            }
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
})
router.post('/update-user', checkAuth, async function(req, res, next){
    try{
        if(CheckPermissions('update-user', req.AuthedUser, req.body?.teamUUID)){
            var profile = await ProfileModel.findById(req.body?.UserID);
            if(profile){
                var role = await RoleModel.findById(req.body.Role);
                profile.TShirtSize = req.body?.TShirtSize;
                profile.Role = req.body?.Role;
                profile.CanManageSubTeams = role.CanManageSubTeams;
                profile.CanManageTeam = role.CanManageTeam;
                profile.GetsTShirt = role.GetsTShirt;
                profile.TShirtText = role.TShirtText;
                await profile.save();
                res.sendStatus(200);
            }else{
                res.sendStatus(400);
            }
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/update-configuration', checkAuth, async function(req, res, next){
    try{
        if(CheckPermissions('update-configuration', req.AuthedUser, req.body?.teamUUID)){
            var team = await TeamModel.findOne({UUID: req.body?.teamUUID});
            if(team){
                team.Name = req.body?.TeamName;
                team.TShirtColorName = req.body?.TShirtColorName;
                team.TShirtColorHEX = (req.body?.TShirtColorHEX).toUpperCase();
                await team.save();
                UpdateRoles(team.Roles, team._id, req.body?.TeamName);
                res.sendStatus(200);
            }else{
                res.sendStatus(400);
            }    
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
})

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
router.put('/upload-individual-user/:teamUUID', checkAuth, async function(req, res, next){
    try{
        if(CheckPermissions('upload-individual-user', req.AuthedUser, req.params?.teamUUID)){
            var team = await TeamModel.findOne({UUID: req.params?.teamUUID});
            if(team){
                AddTeamUser(team._id, req.body.Email, req.body.TShirtSize, req.body.Role);
                res.sendStatus(200);
            }else{
                res.sendStatus(400);
            }    
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
        if(CheckPermissions('upload-batch-users', req.AuthedUser, req.params?.teamUUID)){
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
        }else{
            res.sendStatus(401);
        }
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
        var oldText = role.TShirtText;
        role.TShirtText = `${teamName} ${role.Name}`;
        await role.save();
        var profiles = await ProfileModel.find({Role: roles[i]});
        for(var j=0; j<profiles.length; j++){
            if(profiles[j].TShirtText == oldText) profiles[j].TShirtText = role.TShirtText;
            await profiles[j].save();
        }
    }
}
async function GetMembersOfRole(Role, teamId){
    var role = await RoleModel.findOne({Name: Role, Team: teamId});
    if(role){
        return (await ProfileModel.countDocuments({Role: role._id}));
    }else{
        return 0;
    }
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
    try{
        if(!(await ProfileModel.findOne({Team: teamID, Email: email}))){
            if(!(await UserModel.findOne({Email: email}))){
                //Create a new user and profile
                var allTeachers = (fs.existsSync(`${homeDir}/resources/${process.env.TEACHERSFILE}`)) ? (await csv().fromFile(`${homeDir}/resources/${process.env.TEACHERSFILE}`)) : ([]);
                var allStudents = (fs.existsSync(`${homeDir}/resources/${process.env.STUDENTSFILE}`)) ? (await csv().fromFile(`${homeDir}/resources/${process.env.STUDENTSFILE}`)) : ([]);
                var allSchool = [];
                for(var i=0; i<allStudents.length; i++){
                    allSchool.push({
                        Name: allStudents[i].displayName.split(" (IXL")[0],
                        Email: allStudents[i].userPrincipalName,
                        Year: allStudents[i].displayName.slice(-6, -1)
                    });
                }
                for(var i=0; i<allTeachers.length; i++){
                    allSchool.push({
                        Name: allTeachers[i].displayName,
                        Email: allTeachers[i].userPrincipalName,
                        Year: "Teacher"
                    });
                }
                var newUser = new UserModel({
                    Email: email,
                    Name: "Unnamed User",
                    Nickname: email.split("@")[0],
                    Password: "",
                    TShirtSize: tShirtSize,
                    Year: "Other"
                });
                for(var i=0; i<allSchool.length; i++){
                    if(allSchool[i].Email == email || allSchool[i].Email == `${(email.split("@")[0].toUpperCase())}@${email.split("@")[1]}`){
                        newUser.Name = allSchool[i].Name;
                        newUser.Year = allSchool[i].Year;
                        i=allSchool.length;
                    }
                }
                await newUser.save();
            }
            //Create the profile
            var role = await RoleModel.findById(roleID);
            var user = await UserModel.findOne({Email: email});
            var GetsTShirt = true;
            var otherProfiles = await ProfileModel.find({Email: email});
            if(otherProfiles.length > 0){
                //TODO get configuration for t-shirts
                //! By default everybody gets only 1 t-shirt, to get more it HAS to be changed manually
                if(role.OverridesTShirtTeamPriority){
                    GetsTShirt = true;
                }
                if(GetsTShirt){
                    for(var i=0; i<otherProfiles.length; i++){
                        otherProfiles[i].GetsTShirt = false;
                        await otherProfiles[i].save();
                    }
                }
            }
            var newProfile = new ProfileModel({
                Name: user.Name,
                Email: email,
                GetsTShirt: GetsTShirt,
                Role: roleID,
                Team: teamID,
                TShirtSize: tShirtSize,
                TShirtText: role.TShirtText,
                User: user._id,
                CanManageSubTeams: role.CanManageSubTeams,
                CanManageTeam: role.CanManageTeam,
                CanManageTeamConfiguration: role.CanManageTeamConfiguration
            });
            await newProfile.save();
            var team = await TeamModel.findById(teamID);
            team.Users.push(newProfile._id);
            await team.save();
        }    
    }catch(e){
        console.log(e);
        return null;
    }
}
async function CheckPermissions(route, userID, teamUUID){
    var routesConfiguration = [
        {Route: 'list-roles', RequireOne: ['CanManageTeam', 'CanManageAllTeams']},
        {Route: 'list-users', RequireOne: ['CanManageTeam', 'CanManageAllTeams']},
        {Route: 'team-info', RequireOne: ['CanManageTeam', 'CanManageTeamConfiguration', 'CanManageAllTeams']},
        {Route: 'update-user', RequireOne: ['CanManageTeam', 'CanManageAllTeams']},
        {Route: 'update-configuration', RequireOne: ['CanManageTeam', 'CanManageTeamConfiguration', 'CanManageAllTeams']},
        {Route: 'upload-individual-user', RequireOne: ['CanManageTeam', 'CanManageAllTeams']},
        {Route: 'upload-batch-users', RequireOne: ['CanManageTeam', 'CanManageAllTeams']}
    ];
    var AllowAccess = false;
    var team = await TeamModel.findOne({UUID: teamUUID});
    var profile = await ProfileModel.findOne({Team: team._id, User: userID});
    var user = await UserModel.findById(userID);
    for(var i=0; i<routesConfiguration.length; i++){
        if(route == routesConfiguration[i].Route){
            for(var j=0; j<routesConfiguration[i].RequireOne.length; j++){
                if(profile){
                    if(user[routesConfiguration[i].RequireOne[j]] || profile[routesConfiguration[i].RequireOne[j]]) AllowAccess = true;
                }else{
                    if(user[routesConfiguration[i].RequireOne[j]]) AllowAccess = true;
                }
            }
        }
    }
    return AllowAccess;
}

//Export router
module.exports = router;
//Import modules
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
            res.status(307).redirect('/auth/');
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
router.get('/users-multiple-teams', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            res.status(200).sendFile(`${homeDir}/client/users/multipleTeams/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/users-multiple-tshirts', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            res.status(200).sendFile(`${homeDir}/client/users/multipleTshirts/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/managers', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            res.status(200).sendFile(`${homeDir}/client/users/managers/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/coaches', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            res.status(200).sendFile(`${homeDir}/client/users/coaches/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/search', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            res.status(200).sendFile(`${homeDir}/client/users/search/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/view/:ID', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            res.status(200).sendFile(`${homeDir}/client/users/user/index.html`);
        }else{
            res.status(401).redirect('/');
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
})

//POST routes
router.post('/get-user-name', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user){
            res.status(200).send({Name: user.Name});
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-user-navigation', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        var navigation = `<div class="nav-img"><img src="/images/sf24_logo_black_no_bg_256.png" alt="Springfest 2024 logo"></div>
        <a href="/"><div>Home</div></a>`;
        if(user.CanAccessMeetings || user.CanManageAllMeetings) navigation += `<a href="#"><div>Meetings</div></a>`;
        if(user.CanAccessTeams || user.CanManageAllTeams) navigation += `<a href="/team/list-teams"><div>Teams</div></a>`;
        if(user.CanManageAllUsers) navigation += `<a href="/user/dashboard"><div>Users</div></a>`;
        if(user.CanUseTools) navigation += `<a href="#"><div>Tools</div></a>`;
        if(user.CanManageConfiguration) navigation += `<a href="#"><div>Configuration</div></a>`;
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
router.post('/get-users', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            if(req.body?.Output == "count"){
                var usersCount = await UserModel.countDocuments({});
                res.status(200).send({users: usersCount});
            }else{
                var usersRaw = await UserModel.find({}, null, {sort: {Name: 1}});
                var users = [];
                for(var i=0; i<usersRaw.length; i++){
                    users.push(await GetUserInfo(usersRaw[i]));
                }
                res.status(200).send(users);
            }
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-users-multiple-teams', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            var usersRaw = await UserModel.find({}, null, {sort: {Name: 1}});
            var count = 0;
            var users = [];
            for(var i=0; i<usersRaw.length; i++){
                if((await ProfileModel.countDocuments({Email: usersRaw[i].Email})) > 1){
                    count++;
                    if(req.body?.Output != "count"){
                        users.push(await GetUserInfo(usersRaw[i]));
                    }
                }
            }
            if(req.body?.Output == "count"){
                res.status(200).send({users: count});
            }else{
                res.status(200).send({users});
            }
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-users-multiple-tshirts', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            var usersRaw = await UserModel.find({}, null, {sort: {Name: 1}});
            var count = 0;
            var users = [];
            for(var i=0; i<usersRaw.length; i++){
                if((await ProfileModel.countDocuments({Email: usersRaw[i].Email, GetsTShirt: true})) > 1){
                    count++;
                    if(req.body?.Output != "count"){
                        users.push(await GetUserInfo(usersRaw[i]));
                    }
                }
            }
            if(req.body?.Output == "count"){
                res.status(200).send({users: count});
            }else{
                res.status(200).send({users});
            }
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-managers', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            var usersRaw = await UserModel.find({}, null, {sort: {Name: 1}});
            var count = 0;
            var users = [];
            for(var i=0; i<usersRaw.length; i++){
                var IsManager = false;
                var profiles = await ProfileModel.find({Email: usersRaw[i].Email});
                for(var j=0; j<profiles.length; j++){
                    var role = await RoleModel.findById(profiles[j].Role);
                    if(role?.Name == "Manager"){
                        IsManager = true;
                        j=1000;
                    }
                }
                if(IsManager){
                    count++;
                    if(req.body?.Output != "count"){
                        users.push(await GetUserInfo(usersRaw[i]));
                    }
                }
            }
            if(req.body?.Output == "count"){
                res.status(200).send({users: count});
            }else{
                res.status(200).send({users});
            }
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-coaches', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            var usersRaw = await UserModel.find({}, null, {sort: {Name: 1}});
            var count = 0;
            var users = [];
            for(var i=0; i<usersRaw.length; i++){
                var IsCoach = false;
                var profiles = await ProfileModel.find({Email: usersRaw[i].Email});
                for(var j=0; j<profiles.length; j++){
                    var role = await RoleModel.findById(profiles[j].Role);
                    if(role?.Name == "Coach"){
                        IsCoach = true;
                        j=1000;
                    }
                }
                if(IsCoach){
                    count++;
                    if(req.body?.Output != "count"){
                        users.push(await GetUserInfo(usersRaw[i]));
                    }
                }
            }
            if(req.body?.Output == "count"){
                res.status(200).send({users: count});
            }else{
                res.status(200).send({users});
            }
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/search', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        if(user?.CanManageAllUsers){
            var query = req.query.query;
            var queries = query.split("_");
            if((typeof queries) == "string") queries = [queries];
            var usersEmails = [];
            for(var i=0; i<queries.length; i++){
                var newUsers = (await UserModel.find({$or: [{Name: {$regex: queries[i], $options: 'i'}}, {Email: {$regex: queries[i], $options: 'i'}}], Email: {$nin: usersEmails}}))
                for(var j=0; j<newUsers.length; j++){
                    usersEmails.push(newUsers[j].Email);
                }
            }
            var usersRaw = await UserModel.find({Email: {$in: usersEmails}}, null, {sort: {Name: 1}});
            var users = [];
            for(var i=0; i<usersRaw.length; i++){
                users.push(await GetUserInfo(usersRaw[i]));
            }
            res.status(200).send(users);
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-user', checkAuth, async function(req, res, next){
    try{
        var loggedUser = await UserModel.findById(req.AuthedUser);
        if(loggedUser?.CanManageAllUsers){
            var userID = req.body?.UserID;
            var user = await UserModel.findById(userID);
            if(user){
                var responseUser = await GetUserInfo(user);
                if(user.Password){
                    responseUser.Activated = true;
                }else{
                    responseUser.Activated = false;
                }
                res.status(200).send(responseUser);
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
router.post('/update-user', checkAuth, async function(req, res, next){
    try{
        var loggedUser = await UserModel.findById(req.AuthedUser);
        if(loggedUser?.CanManageAllUsers){
            var userID = req.body?.UserID;
            var user = await UserModel.findById(userID);
            if(user){
                var request = req.body;
                if(user.Email != request.Email && (await UserModel.find({Email: request.Email, Nickname: {$ne: user.Nickname}})).length == 0){
                    user.Email = request.Email;
                    var profiles = await ProfileModel.find({User: user._id});
                    for(var i=0; i<profiles.length; i++){
                        profiles[i].Email = request.Email;
                        await profiles[i].save();
                    }
                }
                if(user.Nickname != request.Username && (await UserModel.find({Nickname: request.Username, Email: {$ne: user.Email}})).length == 0) user.Nickname = request.Username;
                if(user.Name != request.Name){
                    user.Name = request.Name;
                    var profiles = await ProfileModel.find({User: user._id});
                    for(var i=0; i<profiles.length; i++){
                        profiles[i].Name = request.Name;
                        await profiles[i].save();
                    }
                }
                if(user.TShirtSize != request.TShirtSize){
                    user.TShirtSize = request.TShirtSize;
                    var profiles = await ProfileModel.find({User: user._id});
                    for(var i=0; i<profiles.length; i++){
                        profiles[i].TShirtSize = request.TShirtSize;
                        await profiles[i].save();
                    }
                }
                user.Year = request.Year;
                user.CanAccessMeetings = request.CanAccessMeetings;
                user.CanAccessTeams = request.CanAccessTeams;
                user.CanManageAllMeetings = request.CanManageAllMeetings;
                user.CanManageAllTeams = request.CanManageAllTeams;
                user.CanManageAllUsers = request.CanManageAllUsers;
                user.CanManageConfiguration = request.CanManageConfiguration;
                user.CanUseTools = request.CanUseTools;
                await user.save();
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
router.post('/activate', checkAuth, async function(req, res, next){
    try{
        var loggedUser = await UserModel.findById(req.AuthedUser);
        if(loggedUser.CanManageAllUsers){
            var user = await UserModel.findById(req.body?.UserID);
            if(user){
                var newPassword = ((Math.random() + 1).toString(36).substring(2)).toUpperCase();
                var passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
                var salt = await bcrypt.genSalt(10);
                var passwordSaltedHash = await bcrypt.hash(passwordHash, salt);
                user.Password = passwordSaltedHash;
                await user.save();
                res.status(200).send({Password: newPassword});
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

//DELETE route
router.delete('/delete', checkAuth, async function(req, res, next){
    try{
        var loggedUser = await UserModel.findById(req.AuthedUser);
        if(loggedUser.CanManageAllUsers){
            var user = await UserModel.findByIdAndDelete(req.body?.UserID);
            if(user){
                var cookies = await CookieModel.deleteMany({UserID: user._id});
                var profiles = await ProfileModel.deleteMany({User: user._id});
                for(var i=0; i<profiles.length; i++){
                    var team = await TeamModel.findById(profiles[i].Team);
                    var users = [];
                    for(var j=0; j<team.Users.length; j++){
                        if(team.Users[j] != profiles[i]._id) users.push(team.Users[j]);
                    }
                    team.Users = users;
                    await team.save();
                }
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

async function GetUserInfo(user){
    var profilesRaw = await ProfileModel.find({User: user._id}, null, {sort: {Team: 1}});
    var profiles = [];
    for(var j=0; j<profilesRaw.length; j++){
        var team = await TeamModel.findById(profilesRaw[j].Team);
        var role = await RoleModel.findById(profilesRaw[j].Role);
        profiles.push({
            ID: profilesRaw[j]._id,
            TeamName: team?.Name,
            RoleName: role?.Name,
            GetsTShirt: profilesRaw[j].GetsTShirt,
            TShirtText: profilesRaw[j].TShirtText
        });
    }
    return {
        ID: user._id,
        Name: user.Name,
        Username: user.Nickname,
        Year: user.Year,
        Email: user.Email,
        TShirtSize: user.TShirtSize,
        CanAccessMeetings: user.CanAccessMeetings,
        CanAccessTeams: user.CanAccessTeams,
        CanManageAllMeetings: user.CanManageAllMeetings,
        CanManageAllTeams: user.CanManageAllTeams,
        CanManageAllUsers: user.CanManageAllUsers,
        CanManageConfiguration: user.CanManageConfiguration,
        CanUseTools: user.CanUseTools,
        Profiles: profiles
    }
}

//Export router
module.exports = router;
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
            res.status(307).redirect('/auth/');
        }    
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
}

//Routes

router.get('/:roleID', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        res.status(200).sendFile(`${homeDir}/client/roles/role/index.html`);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//POST routes

router.post('/get-info', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        var role = await RoleModel.findById(req.body?.RoleID);
        if(role){
            var team = await TeamModel.findById(role.Team);
            var response = {
                Name: role.Name,
                TShirtText: role.TShirtText || "",
                GetsTShirt: role.GetsTShirt,
                OverridesTShirtTeamPriority: role.OverridesTShirtTeamPriority,
                CanManageSubTeams: role.CanManageSubTeams,
                CanManageTeam : role.CanManageSubTeams,
                CanManageTeamConfiguration: role.CanManageTeamConfiguration,
                TeamUUID: team.UUID,
                TeamName: team.Name
            }
            res.status(200).send(response);
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/update-role', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        var request = req.body;
        var role = await RoleModel.findById(request?.RoleID);
        if(role){
            var oldName = role.Name;
            role.Name = request.Role;
            var oldText = role.TShirtText;
            if(request.TShirtText == oldText && oldName != request.Role){
                var team = await TeamModel.findById(role.Team);
                role.TShirtText = `${team.Name} ${role.Name}`;
            }else{
                role.TShirtText = request.TShirtText;
            }
            role.OverridesTShirtTeamPriority = request.OverridesTShirtTeamPriority;
            role.CanManageSubTeams = request.CanManageSubTeams;
            role.CanManageTeam = request.CanManageTeam;
            role.CanManageTeamConfiguration = request.CanManageTeamConfiguration;
            role.GetsTShirt = request.GetsTShirt;
            await role.save();
            res.sendStatus(200);
            //Update the users
            var profiles = await ProfileModel.find({Role: role._id});
            for(var i=0; i<profiles.length; i++){
                profiles[i].TShirtText = role.TShirtText;
                profiles[i].CanManageSubTeams = role.CanManageSubTeams;
                profiles[i].CanManageTeam = role.CanManageTeam;
                profiles[i].CanManageTeamConfiguration = role.CanManageTeamConfiguration;
                if(role.GetsTShirt){
                    var GetsTShirt = true;
                    var otherProfiles = await ProfileModel.find({Email: profiles[i].Email});
                    if(otherProfiles.length > 0){
                        //TODO get configuration for t-shirts
                        //! By default everybody gets only 1 t-shirt, to get more it HAS to be changed manually
                        if(role.OverridesTShirtTeamPriority){
                            GetsTShirt = true;
                        }
                        if(GetsTShirt){
                            for(var j=0; j<otherProfiles.length; j++){
                                otherProfiles[j].GetsTShirt = false;
                                await otherProfiles[i].save();
                            }
                        }
                    }
                    profiles[i].GetsTShirt = GetsTShirt;
                }else{
                    profiles[i].GetsTShirt = false;
                }
                await profiles[i].save();
            }
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
})

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
});

router.delete('/delete-role', checkAuth, async function(req, res, next){
    try{
        //TODO authentification
        var role = await RoleModel.findById(req.body?.RoleID);
        if(role){
            var team = await TeamModel.findById(role.Team);
            if(team.Roles.length > 1){
                var NewRoles = [];
                for(var i=0; i<team.Roles.length; i++){
                    if(team.Roles[i].toString() != role._id.toString()) NewRoles.push(team.Roles[i]);
                }
                team.Roles = NewRoles;
                await team.save();
                var profiles = await ProfileModel.find({Role: role._id});
                var newRole = await RoleModel.findById(NewRoles[0]);
                for(var i=0; i<profiles.length; i++){
                    profiles[i].Role = newRole._id;
                    profiles[i].TShirtText = newRole.TShirtText;
                    profiles[i].CanManageSubTeams = newRole.CanManageSubTeams;
                    profiles[i].CanManageTeam = newRole.CanManageTeam;
                    profiles[i].CanManageTeamConfiguration = newRole.CanManageTeamConfiguration;
                    if(newRole.GetsTShirt){
                        var GetsTShirt = true;
                        var otherProfiles = await ProfileModel.find({Email: profiles[i].Email, Role: {$ne: role._id}});
                        if(otherProfiles.length > 0){
                            //TODO get configuration for t-shirts
                            //! By default everybody gets only 1 t-shirt, to get more it HAS to be changed manually
                            if(newRole.OverridesTShirtTeamPriority){
                                GetsTShirt = true;
                            }
                            if(GetsTShirt){
                                for(var j=0; j<otherProfiles.length; j++){
                                    otherProfiles[j].GetsTShirt = false;
                                    await otherProfiles[i].save();
                                }
                            }
                        }
                        profiles[i].GetsTShirt = GetsTShirt;
                    }else{
                        profiles[i].GetsTShirt = false;
                    }
                    await profiles[i].save();
                }
                var deletedRole = await RoleModel.findByIdAndDelete(req.body?.RoleID);
                res.sendStatus(200);
            }else{
                res.sendStatus(401);
            }
        }else{
            res.sendStatus(400)
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Export router
module.exports = router;
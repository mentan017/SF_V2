//Import modules
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const formidable = require('formidable');
const im = require('imagemagick');
const mongoose = require('mongoose');
const path = require('path');
const { execSync, exec } = require('child_process');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

//Import MongoDB models
const CookieModel = require('../models/cookie.js');
const ProfileModel = require('../models/profile.js');
const RoleModel = require('../models/role.js');
const TaskModel = require('../models/task.js');
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
                var user = await UserModel.findById(req.AuthedUser);
                if(user?.CanManageConfiguration){
                    next();
                }else{
                    res.status(401).redirect('/dashboard');
                }
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
router.get('/', checkAuth, async function(req, res, next){
    try{
        res.status(200).sendFile(`${homeDir}/client/configuration/index.html`);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/view/:element', checkAuth, async function(req, res, next){
    try{
        var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`));
        if(req.params?.element == "logo"){
            res.status(200).sendFile(`${homeDir}/client${config.Logo}.${config.LogoExtension}`);
        }else if(req.params?.element == "students"){
            res.status(200).sendFile(`${homeDir}/resources/${config.StudentsFile}`);
        }else if(req.params?.element == "teachers"){
            res.status(200).sendFile(`${homeDir}/resources/${config.StudentsFile}`);
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.get('/export', checkAuth, async function(req, res, next){
    try{
        //All files will be temporarely saved in the data folder
        var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`, 'utf-8'));
        var profiles = await ProfileModel.find({});
        var roles = await RoleModel.find({});
        var tasks = await TaskModel.find({});
        var teams = await TeamModel.find({});
        var users = await UserModel.find({});
        var date = new Date();
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var exportFolder = `${homeDir}/data/${date.getDate()}_${months[date.getMonth()]}_${date.getUTCFullYear()}_${date.getHours()}_${date.getMinutes()}_Springfest_Export`;
        if(!fs.existsSync(exportFolder)){
            fs.mkdirSync(exportFolder);
            fs.mkdirSync(`${exportFolder}/database`);
            fs.writeFileSync(`${exportFolder}/database/profiles.json`, JSON.stringify(profiles));
            fs.writeFileSync(`${exportFolder}/database/roles.json`, JSON.stringify(roles));
            fs.writeFileSync(`${exportFolder}/database/tasks.json`, JSON.stringify(tasks));
            fs.writeFileSync(`${exportFolder}/database/teams.json`, JSON.stringify(teams));
            fs.writeFileSync(`${exportFolder}/database/users.json`, JSON.stringify(users));
            fs.copyFileSync(`${homeDir}/config.json`, `${exportFolder}/config.json`);
            fs.mkdirSync(`${exportFolder}/other_resources`);
            fs.mkdirSync(`${exportFolder}/other_resources/images`);
            fs.copyFileSync(`${homeDir}/resources/${config.StudentsFile}`,`${exportFolder}/other_resources/${config.StudentsFile}`);
            fs.copyFileSync(`${homeDir}/resources/${config.TeachersFile}`,`${exportFolder}/other_resources/${config.TeachersFile}`);
            fs.copyFileSync(`${homeDir}/client${config.Logo}.${config.LogoExtension}`, `${exportFolder}/other_resources${config.Logo}.${config.LogoExtension}`);
            execSync(`cd ${homeDir}/data ; zip -r ${date.getDate()}_${months[date.getMonth()]}_${date.getUTCFullYear()}_${date.getHours()}_${date.getMinutes()}_Springfest_Export.zip ${date.getDate()}_${months[date.getMonth()]}_${date.getUTCFullYear()}_${date.getHours()}_${date.getMinutes()}_Springfest_Export; rm -rf ${exportFolder}`);
            res.status(200).download(`${exportFolder}.zip`);
        }else{
            res.status(400).send("An error occured in the server, please try again later");
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//POST routes
router.post('/get-config', checkAuth, async function(req, res, next){
    try{
        if(fs.existsSync(`${homeDir}/config.json`)){
            var config = fs.readFileSync(`${homeDir}/config.json`, 'utf-8');
            res.status(200).send(JSON.parse(config));
        }else{
            var config = {
                SpringfestDate: 0, //Time in milliseconds
                Logo: '/images/sf24_logo_black_no_bg', //Defaults logo to SF24 logo
                LogoExtension: 'png',
                StudentsFile: '',
                TeachersFile: ''
            }
            fs.writeFileSync(`${homeDir}/config.json`, JSON.stringify(config));
            res.status(200).send(config);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/update-config', checkAuth, async function(req, res, next){
    try{
        var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`, 'utf-8'));
        config.SpringfestDate = req.body?.SpringfestDate;
        fs.writeFileSync(`${homeDir}/config.json`, JSON.stringify(config));
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//PUT routes
router.put('/upload-logo-file', checkAuth, async function(req, res, next){
    try{
        var form = new formidable.IncomingForm();
        form.multiple = false;
        form.parse(req, async function(err, fields, files){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`));
                var SFDate = new Date();
                SFDate.setTime(config.SpringfestDate);
                var logoExtension = "";
                if(files.files[0].mimetype == "image/png"){
                    logoExtension = "png";
                }else if(files.files[0].mimetype == "image/jpg" || files.files[0].mimetype == "image/jpeg"){
                    logoExtension = "jpg";
                }
                if(logoExtension != ""){
                    var newFilepath = uuidv4();
                    fs.copyFileSync(files.files[0].filepath, `${homeDir}/client/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}.${logoExtension}`);
                    //Resize image
                    im.identify(`${homeDir}/client/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}.${logoExtension}`, function(err, features){
                        if(err){
                            console.log(err);
                            throw err;
                        }
                        im.convert([`${homeDir}/client/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}.${logoExtension}`, '-resize', `64x${(features.height*64)/features.width}`, `${homeDir}/client/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}_64.${logoExtension}`], function(err, stdout){if(err) throw err;});
                        im.convert([`${homeDir}/client/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}.${logoExtension}`, '-resize', `128x${(features.height*128)/features.width}`, `${homeDir}/client/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}_128.${logoExtension}`], function(err, stdout){if(err) throw err;});
                        im.convert([`${homeDir}/client/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}.${logoExtension}`, '-resize', `256x${(features.height*256)/features.width}`, `${homeDir}/client/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}_256.${logoExtension}`], function(err, stdout){if(err) throw err;});
                    });
                    config.Logo = `/images/sf${SFDate.getUTCFullYear()}_logo_${newFilepath}`;
                    config.LogoExtension = logoExtension;
                    fs.writeFileSync(`${homeDir}/config.json`, JSON.stringify(config));
                    res.sendStatus(200);
                }else{
                    res.sendStatus(400);
                }
            }
        });
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/upload-students-file', checkAuth, async function(req, res, next){
    try{
        var form = new formidable.IncomingForm();
        form.multiple = false;
        form.parse(req, async function(err, fields, files){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`));
                if(files.files[0].mimetype == "text/csv"){
                    var UUID = uuidv4();
                    fs.copyFileSync(files.files[0].filepath, `${homeDir}/resources/STUDENTS_FILE_${UUID}.csv`);
                    config.StudentsFile = `STUDENTS_FILE_${UUID}.csv`;
                    fs.writeFileSync(`${homeDir}/config.json`, JSON.stringify(config));
                    res.sendStatus(200);
                }else{
                    res.sendStatus(400);
                }
            }
        });
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/upload-teachers-file', checkAuth, async function(req, res, next){
    try{
        var form = new formidable.IncomingForm();
        form.multiple = false;
        form.parse(req, async function(err, fields, files){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`));
                if(files.files[0].mimetype == "text/csv"){
                    var UUID = uuidv4();
                    fs.copyFileSync(files.files[0].filepath, `${homeDir}/resources/TEACHERS_FILE_${UUID}.csv`);
                    config.TeachersFile = `TEACHERS_FILE_${UUID}.csv`;
                    fs.writeFileSync(`${homeDir}/config.json`, JSON.stringify(config));
                    res.sendStatus(200);
                }else{
                    res.sendStatus(400);
                }
            }
        });
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//DELETE routes
router.delete('/reset-all', checkAuth, async function(req, res, next){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        var verification = await bcrypt.compare(req.body?.Password, user?.Password);
        if(verification === true){
            await CookieModel.deleteMany({});
            await ProfileModel.deleteMany({});
            await RoleModel.deleteMany({});
            await TaskModel.deleteMany({});
            await TeamModel.deleteMany({});
            await UserModel.deleteMany({});
            var config = JSON.parse(fs.readFileSync(`${homeDir}/config.json`, 'utf-8'));
            execSync(`rm -rf ${homeDir}/data/*`);
            execSync(`rm -rf ${homeDir}/resources/${config.StudentsFile}`);
            execSync(`rm -rf ${homeDir}/resources/${config.TeachersFile}`);
            var images = fs.readdirSync(`${homeDir}/client/images/`);
            for(var i=0; i<images.length; i++){
                if(images[i].indexOf('sf24_logo_black') == -1) fs.unlinkSync(`${homeDir}/client/images/${images[i]}`);
            }
            config = {
                SpringfestDate: 0, //Time in milliseconds
                Logo: '/images/sf24_logo_black_no_bg', //Defaults logo to SF24 logo
                LogoExtension: 'png',
                StudentsFile: '',
                TeachersFile: ''
            }
            fs.writeFileSync(`${homeDir}/config.json`, JSON.stringify(config));
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
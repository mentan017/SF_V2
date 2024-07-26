//Import modules
const express = require('express');
const fs = require('fs');
const formidable = require('formidable');
const im = require('imagemagick');
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
                Teacher: ''
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

//Export router
module.exports = router;
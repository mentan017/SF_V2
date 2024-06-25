//Import modules
const bcrypt = require('bcrypt');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const {v4: uuidv4} = require('uuid');
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

//Routes

//GET routes
router.get('/', function(req, res){
    res.status(200).sendFile(`${homeDir}/client/auth/index.html`);
});
router.get('/logout', function(req, res){
    try{
        if(req.cookies?.SID){
            CookieModel.findOneAndDelete({UUID: req.cookies.SID});
            res.status(200).clearCookie("SID").redirect('/auth');
        }else{
            res.status(200).redirect('/auth/')
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//POST routes
router.post('/login', async function(req, res){
    try{
        var username = req.body?.Username;
        var password = req.body?.Password;
        if(username && password){
            username = username.toString();
            password = password.toString();
            var user = await UserModel.findOne({$or: [{Nickname: username}, {Email: username}]});
            if(user){
                var verification = await bcrypt.compare(password, user.Password);
                if(verification === true){
                    var cookie = new CookieModel({
                        UserID: user._id,
                        UUID: uuidv4()
                    });
                    await cookie.save();
                    res.status(200).cookie("SID", cookie.UUID).end();
                }else{
                    res.status(401).send({Error: "The nickname/email or the password is wrong"});
                }
            }else{
                res.status(401).send({Error: "The nickname/email or the password is wrong"});
            }
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
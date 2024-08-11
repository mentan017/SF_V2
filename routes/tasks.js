//Import modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

//Import MongoDB models
const CookieModel = require('../models/cookie.js');
const TaskModel = require('../models/task.js');
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
router.get('/new', checkAuth, function(req, res){
    res.status(200).sendFile(`${homeDir}/client/tasks/new/index.html`);
});
router.get('/task/:uuid', checkAuth, function(req, res){
    res.status(200).sendFile(`${homeDir}/client/tasks/task/index.html`);
});

//POST routes
router.post('/user-tasks', checkAuth, async function(req, res){
    try{
        var user = await UserModel.findById(req.AuthedUser);
        var tasks = [];
        for(var i=0; i<user.Tasks.length; i++){
            var task = await TaskModel.findById(user.Tasks[user.Tasks.length-i-1]);
            var TimestampsLength = task.ProgressTimestamps.length;
            tasks.push({
                UUID: task.UUID,
                Description: task.Description,
                Progress: task.ProgressTimestamps[TimestampsLength - 1].Progress
            });
        }
        res.status(200).send({Tasks: tasks});
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/task/:uuid', checkAuth, async function(req, res){
    try{
        if(req.params?.uuid){
            //Check that the user can access this task
            var task = await TaskModel.findOne({UUID: req.params.uuid});
            var user = await UserModel.findById(req.AuthedUser);
            if(user.Tasks.indexOf(task?._id) != -1){
                var taskResponse = {
                    Index: user.Tasks.indexOf(task?._id) + 1,
                    Description: task.Description,
                    ProgressTimestamps: []
                }
                for(var i=0; i<task.ProgressTimestamps.length; i++){
                    var progressUser = await UserModel.findById(task.ProgressTimestamps[i].User);
                    var timestamp = task.ProgressTimestamps[i].Timestamp;
                    var progress = "Undone";
                    if(task.ProgressTimestamps[i].Progress > 0) progress="In Progress";
                    if(task.ProgressTimestamps[i].Progress == 1) progress="Done";
                    taskResponse.ProgressTimestamps.push({
                        Progress: progress,
                        Timestamp: `${parseValue(timestamp.getDate())}/${parseValue(timestamp.getMonth() + 1)}/${timestamp.getFullYear()}, ${parseValue(timestamp.getHours())}h${parseValue(timestamp.getMinutes())}`,
                        User: progressUser.Name
                    });
                }
                res.status(200).send(taskResponse);
            }else{
                res.sendStatus(401);
            }
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//PUT routes
router.put('/new', checkAuth, async function(req, res){
    try{
        //Create a new task and link it to the user
        if(req.body?.Task){
            var user = await UserModel.findByIdAndUpdate(req.AuthedUser);
            if(user){
                var task = new TaskModel({
                    UUID: uuidv4(),
                    Description: req.body.Task,
                    ProgressTimestamps:[{
                        Progress: 0,
                        Timestamp: Date.now(),
                        User: req.AuthedUser
                    }]
                });
                await task.save();
                user.Tasks.push(task._id);
                await user.save();
                res.status(200).send({UUID: task.UUID});
            }else{
                res.sendStatus(400);
            }
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/update', checkAuth, async function(req, res){
    try{
        if(req.body?.UUID){
            var task = await TaskModel.findOne({UUID: req.body.UUID});
            var user = await UserModel.findById(req.AuthedUser);
            if(user.Tasks.includes(task?._id)){
                if(req.body.ProgressModified){
                    task.ProgressTimestamps.push({
                        Progress: req.body.Progress || 0,
                        Timestamp: Date.now(),
                        User: req.AuthedUser
                    });
                }
                task.Description = req.body.Description || "";
                await task.save();
                res.sendStatus(200);
            }else{
                res.sendStatus(401);
            }
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//DELETE routes
router.delete('/delete/:uuid', checkAuth, async function(req, res){
    try{
        if(req.params?.uuid){
            var task = await TaskModel.findOne({UUID: req.params.uuid});
            var user = await UserModel.findById(req.AuthedUser);
            var taskIndex = user.Tasks.indexOf(task._id);
            if(taskIndex != -1){
                user.Tasks.splice(taskIndex, 1);
                await user.save();
                res.sendStatus(200);
            }else{
                res.sendStatus(401);
            }
        }else{
            res.sendStatus(400);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

function parseValue(num){
    var str = num.toString();
    while(str.length < 2){
        str = "0" + str;
    }
    return(str);
}

//Export router
module.exports = router;
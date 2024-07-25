//Import modules
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

//Import MongoDB models
const UserModel = require('./models/user.js');

//Connect to MongoDB database
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.PROJECT_NAME}`);
var db = mongoose.connection;

async function CreateAdmin(){
    //TODO change default password for production
    var password = crypto.createHash('sha256').update('test').digest('hex');
    var salt = await bcrypt.genSalt(10);
    var passwordHash = await bcrypt.hash(password, salt);
    var admin = new UserModel({
        Name: 'Admin',
        Email: 'admin@springfest.eu',
        Nickname: 'admin',
        Password: passwordHash,
        Year: 'System',
        CanAccessMeetings: true,
        CanAccessTeams: true,
        CanManageAllMeetings: true,
        CanManageAllTeams: true,
        CanManageAllUsers: true,
        CanManageConfiguration: true,
        CanUseTools: true
    });
    await admin.save();
    console.log('[INFO] Admin created successfully');
    return 0;
}

CreateAdmin();
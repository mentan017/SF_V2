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
    var password = crypto.createHash('sha256').update(process.env.DEFAULT_ADMIN_PASSWORD).digest('hex');
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
    var config = {
        SpringfestDate: 0, //Time in milliseconds
        Logo: '/images/sf24_logo_black_no_bg', //Defaults logo to SF24 logo
        LogoExtension: 'png',
        StudentsFile: 'students',
        TeachersFile: 'teachers',
        TeamPriorities: []
    }
    fs.writeFileSync(`${homeDir}/config.json`, JSON.stringify(config));
    console.log("[INFO] Default configuration created successfully");
    return 0;
}

CreateAdmin();
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    Email:{
        type: String
    },
    Name:{
        type: String
    },
    Nickname:{
        type: String
    },
    Password:{
        type: String
    },
    Tasks:[{
        type: mongoose.Schema.Types.ObjectId
    }],
    TShirtSize:{
        type: String,
        default: "L"
    },
    Year:{
        type: Number
    },
    //General user permissions
    CanManageAllTeams:{
        type: Boolean,
        default: false
    },
    CanManageAllUsers:{
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', UserSchema);
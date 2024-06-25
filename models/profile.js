const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    GetsTShirt:{
        type: Boolean
    },
    Role:{ //When role defaults change, permissions change too
        type: mongoose.Schema.Types.ObjectId
    },
    Team:{
        type: mongoose.Schema.Types.ObjectId
    },
    TShirtSize:{
        type: String
    },
    TShirtText:{
        type: String
    },
    User:{
        type: mongoose.Schema.Types.ObjectId
    },
    //Permissions (defaults by assigned role)
    CanManageSubTeams:{
        type: Boolean
    },
    CanManageTeam:{
        type: Boolean
    }
});

module.exports = mongoose.model('Profile', ProfileSchema);
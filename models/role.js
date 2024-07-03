const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    Name:{
        type: String
    },
    Team:{
        type: mongoose.Schema.Types.ObjectId
    },
    //TODO Permissions
    TShirtText:{
        type: String
    },
    GetsTShirt:{
        type: Boolean,
        default: true
    },
    OverridesTShirtTeamPriority:{
        type: Boolean,
        default: false
    },
    CanManageSubTeams:{
        type: Boolean,
        default: false
    },
    CanManageTeam:{
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Role', RoleSchema)
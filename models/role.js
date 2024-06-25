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
        type: Boolean
    },
    OverridesTShirtTeamPriority:{
        type: Boolean,
        default: false
    },
    CanManageSubTeams:{
        type: Boolean
    },
    CanManageTeam:{
        type: Boolean
    }
});

module.exports = mongoose.model('Role', RoleSchema)
const mongoose = require('mongoose');

const SubTeamSchema = new mongoose.Schema({
    Name:{
        type: String
    },
    Users:[{
        type: mongoose.Schema.Types.ObjectId
    }],
    Roles:[{
        type: mongoose.Schema.Types.ObjectId
    }]
});

module.exports = mongoose.model('SubTeam', SubTeamSchema);
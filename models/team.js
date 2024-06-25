const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    Name:{
        type: String
    },
    Roles:[{
        type: mongoose.Schema.Types.ObjectId
    }],
    SubTeams:[{
        type: mongoose.Schema.Types.ObjectId
    }],
    TShirtColorName:{
        type: String
    },
    TShirtColorHEX:{
        type: String
    },
    Users:[{ //Each user has one profile for each team they are in, it defines their permissions, t-shirt, etc
        type: mongoose.Schema.Types.ObjectId
    }],
});

module.exports = mongoose.model('Team', TeamSchema);
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    UUID:{
        type: String
    },
    Description:{
        type: String
    },
    ProgressTimestamps:[{
        Progress:{
            type: Number
        },
        Timestamp:{
            type: Date
        },
        User:{
            type: mongoose.Schema.Types.ObjectId
        }
    }]
});

module.exports = mongoose.model('Task', TaskSchema);
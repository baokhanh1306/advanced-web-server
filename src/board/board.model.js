const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    }
});


const boardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    playerX: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    playerO: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    winner: {
        type: Number,
        enum: [-1,0,1],
        default: 0,
    },
    history: [String],
    conversation: [conversationSchema],  
}, { timestamps: true });

const Board = new mongoose.model('Board', boardSchema);

module.exports = Board;
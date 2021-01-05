const mongoose = require('mongoose');
const User = require('../user/user.model');

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
    conversation: [{
        name: String,
        text: String
    }],
    password : {
        type: String,
        default: '',
    }  
}, { timestamps: true });


boardSchema.pre('save', async function(next) {
    const board = this;
    if (board.isModified('winner')) {
        const playerX = await User.findById(board.playerX);
        const playerO = await User.findById(board.playerO);

        playerX.games += 1;
        playerO.games += 1;

        playerX.history.push(board._id);
        playerO.history.push(board._id);

        //if playerX win
        if (board.winner === -1) {
            playerX.cups += 1;
            playerX.gamesWon += 1;
            playerX.winningPercent = playerX.gamesWon / playerX.games;
            playerO.cups -= 1;
            playerO.winningPercent = playerO.gamesWon / playerO.games;
        }
        else {
            playerO.cups += 1;
            playerO.gamesWon += 1;
            playerO.winningPercent = playerO.gamesWon / playerO.games;
            playerX.cups -= 1;
            playerX.winningPercent = playerX.gamesWon / playerX.games;
        }

        await playerX.save();
        await playerO.save();
    }
    next();
});

const Board = new mongoose.model('Board', boardSchema);

module.exports = Board;
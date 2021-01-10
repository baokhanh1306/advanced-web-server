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
    enum: [-1, 0, 1],
    default: 0,
  },
  history: [String],
  conversation: [{
    user: String,
    value: String,
  }],
  password: {
    type: String,
    default: '',
  },
  uuid: String
}, { timestamps: true });


boardSchema.pre('save', async function (next) {
  const board = this;
  if (board.isModified('winner')) {
    const playerX = await User.findById(board.playerX);
    const playerO = await User.findById(board.playerO);

    playerX.games += 1;
    playerO.games += 1;

    playerX.history.push(board._id);
    playerO.history.push(board._id);

    let diffCups = Math.abs(playerX.cups - playerO.cups);
    let bonusCups = diffCups <= 5 ? 1 : 5;

    //if playerX win
    if (board.winner === -1) {
      playerX.cups += playerX.cups >= playerO.cups ? 1 : bonusCups;
      playerX.gamesWon += 1;
      playerX.winningPercent = playerX.gamesWon / playerX.games;
      playerO.cups -= playerX.cups >= playerO.cups ? 1 : bonusCups;
      playerO.winningPercent = playerO.gamesWon / playerO.games;
    }
    else {
      playerO.cups += playerO.cups >= playerX.cups ? 1 : bonusCups;
      playerO.gamesWon += 1;
      playerO.winningPercent = playerO.gamesWon / playerO.games;
      playerX.cups -= playerO.cups >= playerX.cups ? 1 : bonusCups;
      playerX.winningPercent = playerX.gamesWon / playerX.games;
    }

    playerX.cups = playerX.cups < 0 ? 0 : playerX.cups
    playerO.cups = playerO.cups < 0 ? 0 : playerO.cups

    await playerX.save();
    await playerO.save();
  }
  next();
});

const Board = new mongoose.model('Board', boardSchema);

module.exports = Board;
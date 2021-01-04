const catchAsync = require('../middlewares/catchAsync');
const ErrorHandler = require('../middlewares/ErrorHandler');
const Board = require('./board.model');

exports.saveBoard = catchAsync(async (req, res, next) => {
  const playerO = req.user.id;
  const { id, winner, history, conversation } = req.body;
  const board = await Board.findById(id);
  if (!board) {
    throw new ErrorHandler(400, 'Board not found');
  }
  board.playerO = playerO;
  board.winner = winner;
  board.history = history;
  board.conversation = conversation;
  await board.save();
  res.json({ msg: 'Save board successfully', board });
});

exports.getBoard = catchAsync(async (_req, res, _next) => {
  const boards = await Board.find({ winner: 0 }).sort({ createdAt: -1 });
  res.json({ msg: 'Get boards successfully', data: boards });
});

exports.getBoardById = catchAsync(async (req, res, _next) => {
  const board = await Board.findById(req.params.id)
                            .populate('playerX')
                            .populate('playerO');
  res.json({ msg: 'Get board successfully', data: board });
});
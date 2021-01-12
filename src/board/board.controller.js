const catchAsync = require('../middlewares/catchAsync');
const ErrorHandler = require('../middlewares/ErrorHandler');
const Board = require('./board.model');

exports.saveBoard = catchAsync(async (req, res, next) => {
  const foundBoard = await Board.findOne({ uuid: req.body.uuid })
  console.log(foundBoard);
  if (!foundBoard) {
    const board = new Board(req.body);
    await board.save();
    console.log(board);
  }
  res.json({ msg: 'Save board successfully' });
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
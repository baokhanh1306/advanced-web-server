const catchAsync = require('../middlewares/catchAsync');
const ErrorHandler = require('../middlewares/ErrorHandler');
const Board = require('./board.model');


exports.saveBoard = catchAsync(async (req,res,next) => {
    const { _id, playerO, winner, history } = req.body;
    const board = await Board.findByIdAndUpdate(_id, { playerO, winner, history });
    if (!board) {
        throw new ErrorHandler(400, 'Board not found');
    }
    res.json({ msg: 'Save board successfully', board });
});
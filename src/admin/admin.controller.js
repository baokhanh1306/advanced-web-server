const Board = require('../board/board.model');
const catchAsync = require('../middlewares/catchAsync');
const { ErrorHandler } = require('../middlewares/ErrorHandler');
const User = require('../user/user.model');

exports.dashboard = catchAsync(async (req, res, next) => {
  res.status(200).json({ msg: 'Admin dashboard' });
});

exports.userList = catchAsync(async (req, res, next) => {
  const filter = req.query.filter || '';
  const q = req.query.q || '';
  const regex = new RegExp('^' + q + '$', 'i');
  let users;
  if (q === '' || filter === '') {
    users = await User.find({ role: false }).select(
      'username email cups games banned'
    );
  } else if (filter === 'email') {
    users = await User.find({ email: regex, role: false }).select(
      'username email cups games banned'
    );
  } else if (filter === 'name') {
    users = await User.find({ username: regex, role: false }).select(
      'username email cups games banned'
    );
  }
  res.json({ msg: 'User list', users });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.body;
  const user = await User.findById(id).select('-password');
  if (!user) {
    return res.json({ msg: 'User not found' });
  }
  res.json({ msg: 'User detail', user });
});

exports.ban = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new ErrorHandler(400, 'Invalid user');
  }
  user.banned = true;
  await user.save();
  const users = await User.find({ role: false }).select(
    'username email cups games banned'
  );
  res.json({ msg: 'User has been banned', users });
});

exports.unban = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    throw new ErrorHandler(400, 'Invalid user');
  }
  user.banned = false;
  await user.save();
  const users = await User.find({ role: false }).select(
    'username email cups games banned'
  );
  res.json({ msg: 'User has been unbanned', users });
});

exports.getBoards = catchAsync(async (req, res, next) => {
  const boards = await Board.find({}).populate('playerX').populate('playerO');
  res.json({ msg: 'Board list', boards });
});

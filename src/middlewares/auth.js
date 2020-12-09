const User = require('../user/user.model');
const { ErrorHandler } = require('./ErrorHandler');
const catchAsync = require('./catchAsync');
const jwt = require('jsonwebtoken');

exports.auth = catchAsync(async (req, res, next) => {
  const token =
    req.header('Authorization') &&
    req.header('Authorization').replace('Bearer ', '');
  if (!token) {
    throw new ErrorHandler(401, 'Not authorized to access');
  }
  const data = jwt.verify(token, process.env.JWT_KEY);
  const user = await User.findOne({ email: data.email, tokens: token });
  if (!user) {
    throw new ErrorHandler(401, 'Not authorized to access');
  }
  req.user = { id: user._id, username: user.username, email: user.email, role: user.role, token };
  req.token = token;
  next();
});


exports.isAdmin = catchAsync(async (req, res, next) => {
  const { role } = req.user;
  if (!role) {
    throw new ErrorHandler('401', 'Not authorized to access');
  }
  next();
});

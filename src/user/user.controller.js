const catchAsync = require('../middlewares/catchAsync');
const { ErrorHandler } = require('../middlewares/ErrorHandler');
const User = require('./user.model');

exports.register = catchAsync(async (req, res, next) => {
  const foundUser = await User.findOne({ email: req.body.email });
  if (foundUser) {
    throw new ErrorHandler(400, 'Email has been registered');
  }
  const user = new User(req.body);
  await user.save();
  res.status(201).json({ msg: 'Register successfully' });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findByCredentials(email, password);
  const token = await user.generateToken();

  res.json({ token, email: user.email });
});

exports.getById = catchAsync(async (req, res, next) => {
  const { id } = req.params
  const user = await User.findById(id).select('-password')
  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }
  res.status(200).json({ data: user, msg: 'Get user successfully' })
})

exports.getUser = (req, res, next) => {
  res.json({ ...req.user });
};
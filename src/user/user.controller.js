const catchAsync = require('../middlewares/catchAsync');
const { ErrorHandler } = require('../middlewares/ErrorHandler');
const User = require('./user.model');
const nodemailer = require('nodemailer');
const { errorMonitor } = require('nodemailer/lib/mailer');
const Board = require('../board/board.model');
const { v4: uuidv4 } = require('uuid');
const filterParams = require('../utils/filterParams');

const URL =
  process.env.NODE_ENV !== 'prod'
    ? 'http://localhost:4000'
    : process.env.HOST_DEPLOY_URL;
const CLIENT_URL =
  process.env.NODE_ENV !== 'prod'
    ? 'http://localhost:3000'
    : process.env.CLIENT_DEPLOY_URL;

exports.register = catchAsync(async (req, res, next) => {
  const foundUser = await User.findOne({ email: req.body.email });
  if (foundUser) {
    throw new ErrorHandler(400, 'Email has been registered');
  }
  const user = new User(req.body);
  await user.save();

  //confirm email
  const link = `${URL}/api/users/confirmation/${user._id}`;
  const smtpTransport = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const mailOptions = {
    to: `${user.email}`,
    subject: 'Confirm your email',
    html: `Hello,<br> Please Follow the link to verify your email.<br>${link}`
  };
  await smtpTransport.sendMail(mailOptions);

  res.status(201).json({ msg: 'Register successfully' });
});

exports.google = catchAsync(async (req, res, next) => {
  const { email } = req.body
  const foundUser = await User.findOne({ email })
  if (foundUser) {
    const token = await foundUser.generateToken();
    res.json({ token, email: foundUser.email, isAdmin: foundUser.role });
  } else {
    const user = new User(req.body);
    user.confirmed = true
    await user.save();
    const token = await user.generateToken();
    res.json({ token, email: user.email, isAdmin: user.role });
  }
})

exports.confirmEmail = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (user) {
    if (!user.confirmed) {
      user.confirmed = true;
      await user.save();
    }
  }
  res.status(200).json({ msg: 'Confirm successfully' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  const id = uuidv4();
  if (!user) {
    throw new ErrorHandler(400, 'Email does not exist');
  }
  user.resetToken = id;
  await user.save();
  const link = `${CLIENT_URL}/reset-password/${id}`;
  const smtpTransport = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const mailOptions = {
    to: `${email}`,
    subject: 'Reset your password',
    html: `Hello,<br> Please Follow the link to reset your password.<br>${link}`
  };
  await smtpTransport.sendMail(mailOptions);
  res.json({ msg: 'Email has been sent' });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { email, password, confirmedPassword, token } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ErrorHandler(400, 'Invalid user');
  }
  if (user.resetToken !== token) {
    throw new ErrorHandler(400, 'Invalid token')
  }
  if (password !== confirmedPassword) {
    throw new ErrorHandler(400, 'Confirmed password did not match');
  }
  user.password = password;
  await user.save();
  res.json({ msg: 'Change password successfully' });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findByCredentials(email, password);
  if (!user.confirmed) {
    throw new ErrorHandler(400, 'Please confirm your email');
  }
  if (user.banned) {
    throw new ErrorHandler(400, 'Your user has been banned');
  }
  const token = await user.generateToken();

  res.json({ token, email: user.email, isAdmin: user.role });
});

exports.getById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }
  res.status(200).json({ data: user, msg: 'Get user successfully' });
});

exports.getLeaderBoard = catchAsync(async (req, res, next) => {
  const users = await User.find({}).sort({ cups: 'desc' }).limit(20).select('-password -tokens');
  res.json({ data: users, msg: 'Get leaderboard successfully' });
});

exports.getHistory = catchAsync(async (req, res, next) => {
  const history = req.user.history;
  const boards = await Board.find({ _id: { $in: history } }).populate('playerX playerO').sort({ createdAt: -1 });
  res.json({ data: boards, msg: 'Get user history successfully' });
});

exports.updateById = catchAsync(async (req, res, next) => {
  const { _id, avatar, username } = req.body
  const user = await User.findById(_id)
  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }
  const update = { $set: {} }
  if (avatar) {
    update.$set.avatar = avatar
  }
  if (username) {
    update.$set.username = username
  }
  const updated = await User.findByIdAndUpdate(_id, update, { new: true }).select('-password -tokens')
  res.json({ data: updated, msg: 'Update user successfully' })
});

exports.getUser = (req, res, next) => {
  res.json(req.user);
};

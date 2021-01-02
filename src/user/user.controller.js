const catchAsync = require('../middlewares/catchAsync');
const { ErrorHandler } = require('../middlewares/ErrorHandler');
const User = require('./user.model');
const nodemailer = require('nodemailer');

exports.register = catchAsync(async (req, res, next) => {
  const foundUser = await User.findOne({ email: req.body.email });
  if (foundUser) {
    throw new ErrorHandler(400, 'Email has been registered');
  }
  const user = new User(req.body);
  await user.save();

  //confirm email
  const link = `http://localhost:4000/api/users/confirmation/${user._id}`;
  const smtpTransport = nodemailer.createTransport({
    service: 'Gmail',
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

exports.confirmEmail = catchAsync(async (req,res,next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (user) {
    if (!user.confirmed) {
      user.confirmed = true;
      await user.save();
    }
  }
  res.status(200).json({ msg: 'Confirm successfully'});
});

exports.resetPassword = catchAsync(async (req,res,next) => {
  const { email } = req.body;
  const user = await User.findOne({email});
  if (!user) {
    throw new ErrorHandler(400, 'Invalid user');
  }
  const link = `http://localhost:3000/users/${email}`;
  const smtpTransport = nodemailer.createTransport({
    service: 'Gmail',
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
  res.json({ msg: 'Email has been sent'});
});

exports.changePassword = catchAsync(async (req,res,next) => {
  const { email, password } = req.body;
  const user = await User.findOne({email});
  if (!user) {
    throw new ErrorHandler(400, 'Invalid user');
  }
  user.password = password;
  await user.save();
  res.json({ msg: 'Change password successfully'});
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findByCredentials(email, password);
  const token = await user.generateToken();

  res.json({ token, email: user.email });
});

exports.getById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }
  res.status(200).json({ data: user, msg: 'Get user successfully' });
});

exports.getUser = (req, res, next) => {
  res.json({ ...req.user });
};

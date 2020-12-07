const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../middlewares/ErrorHandler');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true
    },
    password: String,
    tokens: [
      {
        type: String,
        required: true
      }
    ],
    username: {
      type: String,
      required: true
    },
    role: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

userSchema.methods.generateToken = async function () {
  const user = this;
  const token = jwt.sign({ email: user.email }, process.env.JWT_KEY);
  user.tokens = user.tokens.concat(token);
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw new ErrorHandler(400, 'Invalid login credentials');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ErrorHandler(400, 'Invalid login credentials');
  }
  return user;
};

const User = new mongoose.model('User', userSchema);

module.exports = User;

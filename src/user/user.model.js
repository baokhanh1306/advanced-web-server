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
    },
    confirmed: {
      type: Boolean,
      default: false
    },
    cups: {
      type: Number,
      default: 0
    },
    games: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    winningPercent: {
      type: Number,
      default: 0
    },
    banned: {
      type: Boolean,
      default: false,
    },
    googleId: String,
    facebookId: String,
    avatar: { type: String, default: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' },
    history: [{ type: mongoose.Types.ObjectId, ref: 'Board' }],
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

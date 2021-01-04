const express = require('express');
const {
  register,
  login,
  getUser,
  getById,
  confirmEmail,
  changePassword,
  resetPassword,
  getLeaderBoard,
  getHistory
} = require('./user.controller');
const passport = require('passport');

const router = express.Router();
router.get('/', passport.authenticate('jwt', { session: false }), getUser);
router.get(
  '/history',
  passport.authenticate('jwt', { session: false }),
  getHistory
);
router.get('/:id', getById);
router.post('/register', register);
router.post('/login', login);
router.get('/confirmation/:id', confirmEmail);
router.post('/reset', resetPassword);
router.post('/changePassword', changePassword);
router.get('/leaderboard', getLeaderBoard);

module.exports = router;

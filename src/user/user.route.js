const express = require('express');
const { register, login, getUser, getById, confirmEmail, changePassword, resetPassword } = require('./user.controller');
const passport = require('passport');

const router = express.Router();
router.get('/', passport.authenticate('jwt', {session: false}), getUser);
router.get('/:id', getById);
router.post('/register', register);
router.post('/login', login);
router.get('/confirmation/:id', confirmEmail);
router.post('/reset', resetPassword);
router.post('/changePassword', changePassword);

module.exports = router;
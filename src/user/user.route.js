const express = require('express');
const { register, login, getUser } = require('./user.controller');
const { auth } = require('../middlewares/auth');

const router = express.Router();
router.get('/', auth, getUser);
router.post('/register', register);
router.post('/login', login);

module.exports = router;
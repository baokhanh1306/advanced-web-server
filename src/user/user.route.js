const express = require('express');
const { register, login, getUser, getById } = require('./user.controller');
const { auth } = require('../middlewares/auth');

const router = express.Router();
router.get('/', auth, getUser);
router.get('/:id', getById);
router.post('/register', register);
router.post('/login', login);

module.exports = router;
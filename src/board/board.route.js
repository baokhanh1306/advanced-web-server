const express = require('express');
const { auth } = require('../middlewares/auth');
const { saveBoard } = require('./board.controller');

const router = express.Router();

router.post('/', auth ,saveBoard);

module.exports = router;
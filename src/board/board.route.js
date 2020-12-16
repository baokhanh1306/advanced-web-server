const express = require('express');
const { auth } = require('../middlewares/auth');
const { saveBoard, getBoard } = require('./board.controller');

const router = express.Router();

router.get('/', getBoard);
router.post('/', auth, saveBoard);

module.exports = router;

const express = require('express');
const { auth } = require('../middlewares/auth');
const { saveBoard, getBoard, getBoardById } = require('./board.controller');

const router = express.Router();

router.get('/', getBoard);
router.get('/:id', getBoardById);
router.post('/', auth, saveBoard);

module.exports = router;

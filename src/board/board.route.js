const express = require('express');
const passport = require('passport');
const { saveBoard, getBoard, getBoardById } = require('./board.controller');

const router = express.Router();

router.get('/', getBoard);
router.get('/:id', getBoardById);
router.post('/', passport.authenticate('jwt', {session:false}), saveBoard);

module.exports = router;

const express = require('express');
const { isAdmin } = require('../middlewares/auth');
const { dashboard, userList, getBoards, ban, unban } = require('./admin.controller');
const passport = require('passport');

const router = express.Router();

router.use(passport.authenticate('jwt', { session: false }));
router.use(isAdmin);

router.get('/dashboard', dashboard);
router.get('/users', userList);
router.get('/boards', getBoards);
router.delete('/users/:id', ban);
router.put('/users/:id', unban);

module.exports = router;
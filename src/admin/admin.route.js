const express = require('express');
const { isAdmin } = require('../middlewares/auth');
const { dashboard } = require('./admin.controller');
const passport = require('passport');

const router = express.Router();

router.get('/dashboard', passport.authenticate('jwt', {session: false}), isAdmin, dashboard);

module.exports = router;
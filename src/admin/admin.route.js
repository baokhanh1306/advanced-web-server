const express = require('express');
const { auth, isAdmin } = require('../middlewares/auth');
const { dashboard } = require('./admin.controller');

const router = express.Router();

router.get('/dashboard', auth, isAdmin, dashboard);

module.exports = router;
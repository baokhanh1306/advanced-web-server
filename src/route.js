const express = require('express');

const router = express.Router();

router.use('/users', require('./user/user.route'));
router.use('/admin', require('./admin/admin.route'));

module.exports = router;

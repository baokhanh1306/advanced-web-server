const express = require('express');

const router = express.Router();

router.use('/users', require('./user/user.route'));
router.use('/admin', require('./admin/admin.route'));
router.use('/boards', require('./board/board.route'));

module.exports = router;

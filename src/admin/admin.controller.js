const catchAsync = require("../middlewares/catchAsync");

exports.dashboard = catchAsync(async (req, res, next) => {
    res.status(200).json({ msg: 'Admin dashboard'});
});
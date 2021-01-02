const catchAsync = require("../middlewares/catchAsync");
const { ErrorHandler } = require("../middlewares/ErrorHandler");
const User = require('../user/user.model');

exports.dashboard = catchAsync(async (req, res, next) => {
    res.status(200).json({ msg: 'Admin dashboard'});
});

exports.userList = catchAsync(async (req,res,next) => {
    const users = await User.find({});
    res.json({ msg: 'User list',users});
});

exports.findUser = catchAsync(async (req,res,next) => {
    const filter = req.body.filter;
    let user;
    if (filter === 'name') {
        user = await User.findOne({ name: req.body.name });
    }
    else {
        user = await User.findOne({ email: req.body.email });
    }
    if (!user) {
        return res.json({ msg: 'User not found'});
    }
    res.json({ msg: 'User', user});
});

exports.getUser = catchAsync(async (req,res,next) => {
    const { id } = req.body;
    const user = await User.findById(id).select('-password');
    if (!user) {
        return res.json({ msg: 'User not found'});
    }
    res.json({ msg: 'User detail', user});
});

exports.ban = catchAsync(async (req,res,next) => {
    const { id } = req.body;
    const user = await User.findById(id).select('-password');
    if (!user) {
        throw new ErrorHandler(400, 'Invalid user');
    }
    await User.deleteOne({ _id: id});
    res.json({ msg: 'User has been deleted'});
});




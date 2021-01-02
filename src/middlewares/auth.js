const { ErrorHandler } = require('./ErrorHandler');
const catchAsync = require('./catchAsync');

exports.isAdmin = catchAsync(async (req, res, next) => {
  const { role } = req.user;
  if (!role) {
    throw new ErrorHandler('401', 'Not authorized to access');
  }
  next();
});

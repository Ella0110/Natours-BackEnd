const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword.',
      ),
    );
  }

  // 2) Update user document
  // 这里不使用save()而是update是因为: 首先save不能用于update，他们是互斥的；其次save需要验证password和password Confirm，但这里不能输入密码
  // 这里使用filteredBody是因为如果直接使用req.body，用户可能直接在body中输入role:admin获取权限，这是很大的问题，需要避免，只能让用户修改固定内容
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // 返回更新后的数据，而不是原来的
    runValidators: true, // 保证Update也能使用shcema中的验证机制
  });

  // 3) SEND RESPONSE
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.',
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// DO NOT use this route to uodate password!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

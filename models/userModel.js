const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please tell us your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'guide', 'lead-guide', 'admin'],
  },
  password: {
    type: String,
    required: [true, 'Please tell us your password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'passwords are not the same',
    },
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// 这个中间件用于在创建新用户/修改密码时，将密码加密存入数据库，而不是存储明文，同时删除 passwordConfirm
userSchema.pre('save', async function (next) {
  // Only run this when password was actually modified
  if (!this.isModified('password')) return next(); // isModified 判定密码是否被修改，如果没被修改，则退出

  this.password = await bcrypt.hash(this.password, 12); // Hash the pass word with cost of 12
  this.passwordConfirm = undefined; // Delete the passwordConfirm field

  next();
});

// 这个中间件是要在修改密码后给 document 新增一个 passwordChangedAt 字段
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next(); //如果密码没被修改或者这是一个新建的 document，就退出
  // 因为数据存储时间比 JWT 发出时间慢一点，所以如果直接赋值现在时间，会导致用户无法登陆，所以要 -1s
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// 功能：find 开头的函数，查找时仅返回 active 不为 false 的数据；false 代表该数据在用户角度已被删除
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// 检查用户输入的密码与数据库中的密码是否一致，需要加密后比较
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 判断用户是否修改了密码，比较用户修改密码时间和 token 生成时间，默认为 false 表示为未修改密码或者修改密码但在 token 生成之前
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // 方法中的 this 指向当前的 ducument，所以可以使用它访问 schema
  // passwordChangedAt 这个字段在注册用户时不会写入数据库，只有在更新用户密码才会写入，因此如果不更新就不存在
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      // 转换为 10 进制整数
      this.passwordChangedAt.getTime() / 1000, //passwordChangedAt是毫秒，需要转换为秒
      10,
    );
    return changedTimestamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10min = 10 * 60 * 1000 ms
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// 用于整合 error code 和 message，抽象出来，便于其他 api 方法调用
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // 代表是否为可预期的错误，在后面的错误处理中可能会遇到一些非 operational 的错误，这些错误没有这个字段，便于管理
    this.isOperational = true;

    // 可以将 err.stack 通过这种方式返回给 errHandler
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

const TourModel = require('../../../models/tourModel');
const handlerFactory = require('../../../controllers/handlerFactory');
const createHttpMocks = require('../../helpers/httpMocks');

const deleteOne = handlerFactory.deleteOne(TourModel);

jest.mock('../../../models/tourModel.js');

/* ------------------------------------------------------------------ */
/* factory.deleteOne                                                  */
/* ------------------------------------------------------------------ */

describe('factory.deleteOne', () => {
  afterEach(() => jest.clearAllMocks());

  // 测试返回是否是 middleware
  it('should return a Express middleware function', () => {
    const mw = handlerFactory.deleteOne(TourModel);
    expect(typeof mw).toBe('function');
    expect(mw.length).toBe(3);
  });

  // 测试正常返回
  it('returns 204 when document is deleted', async () => {
    // arrange
    TourModel.findByIdAndDelete.mockResolvedValueOnce({ _id: 'abc' });
    const { req, res, next } = createHttpMocks('abc');

    // act
    await deleteOne(req, res, next);

    // assert
    expect(TourModel.findByIdAndDelete).toHaveBeenCalledWith('abc');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: null });
    expect(next).not.toHaveBeenCalled();
  });

  // 测试 id 错误，返回 404
  it('calls next(err404) when no document found', async () => {
    // arrange
    TourModel.findByIdAndDelete.mockResolvedValueOnce(null);
    const { req, res, next } = createHttpMocks('missing-id');

    // act
    await deleteOne(req, res, next);

    // assert
    expect(TourModel.findByIdAndDelete).toHaveBeenCalledWith('missing-id'); // 数据库方法被正确调用
    expect(res.status).not.toHaveBeenCalled(); // 成功分支不应触发
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1); // next 被调用一次，携带 404 错误对象
    const err = next.mock.calls[0][0]; // 取到传入的 error 实例
    expect(err).toMatchObject({ statusCode: 404 });
    expect(err.message).toBe('Not document found with that ID');
  });

  // 测试数据库错误
  it('calls catchAsync error', async () => {
    // arrange
    const dbErr = new Error('DB crashed');
    TourModel.findByIdAndDelete.mockRejectedValueOnce(dbErr);
    const { req, res, next } = createHttpMocks('123');

    // act
    await deleteOne(req, res, next);
    // console.log('Model calls:', TourModel.findByIdAndDelete.mock.calls);
    // console.log('Next calls :', next.mock.calls);

    // assert
    expect(TourModel.findByIdAndDelete).toHaveBeenCalledWith('123');
    expect(res.status).not.toHaveBeenCalled(); // 不应该向客户端发送响应
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(dbErr); // 应把同一个错误对象传给 next
  });
});

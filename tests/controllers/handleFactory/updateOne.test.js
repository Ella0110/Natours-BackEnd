const TourModel = require('../../../models/tourModel');
const handlerFactory = require('../../../controllers/handlerFactory');
const createHttpMocks = require('../../helpers/httpMocks');

const updateOne = handlerFactory.updateOne(TourModel);

jest.mock('../../../models/tourModel.js');

/* ------------------------------------------------------------------ */
/* factory.updateOne                                                  */
/* ------------------------------------------------------------------ */
describe('factory.updateOne', () => {
  afterEach(() => jest.clearAllMocks());

  // 测试返回是否是 middleware
  it('should return a Express middleware function', () => {
    const mw = handlerFactory.updateOne(TourModel);
    expect(typeof mw).toBe('function');
    expect(mw.length).toBe(3);
  });

  // 测试正常返回
  it('return 200 when document is updated', async () => {
    // arrange
    const fakeDoc = { _id: 'abc', name: 'newDoc' };
    TourModel.findByIdAndUpdate.mockResolvedValueOnce(fakeDoc);
    const { req, res, next } = createHttpMocks('123', { name: 'newDoc' });

    // act
    await updateOne(req, res, next);

    //assert
    expect(TourModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '123',
      { name: 'newDoc' },
      {
        new: true,
        runValidators: true,
      },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { data: fakeDoc },
    });
    expect(next).not.toHaveBeenCalled();
  });

  // 测试返回 404
  it('calls next(err404) when no document found', async () => {
    // arrange
    TourModel.findByIdAndUpdate.mockResolvedValueOnce(null);
    const { req, res, next } = createHttpMocks('null', { name: 'null' });
    // act
    await updateOne(req, res, next);

    // assert
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toMatchObject({ statusCode: 404 });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  // 测试数据库异常
  it('calls catchAsync error', async () => {
    // arrange
    const dbErr = new Error('DB crashed');
    TourModel.findByIdAndUpdate.mockRejectedValueOnce(dbErr);
    const { req, res, next } = createHttpMocks('123', { name: '123' });

    // act
    await updateOne(req, res, next);

    // assert
    expect(TourModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled(); // 不应该向客户端发送响应
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(dbErr); // 应把同一个错误对象传给 next
  });
});

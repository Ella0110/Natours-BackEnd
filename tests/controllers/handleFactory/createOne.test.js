const TourModel = require('../../../models/tourModel');
const handlerFactory = require('../../../controllers/handlerFactory');
const createHttpMocks = require('../../helpers/httpMocks');

const createOne = handlerFactory.createOne(TourModel);

jest.mock('../../../models/tourModel.js');

/* ------------------------------------------------------------------ */
/* factory.createOne                                                  */
/* ------------------------------------------------------------------ */
describe('factory.createOne', () => {
  afterEach(() => jest.clearAllMocks());

  // 测试返回是否是 middleware
  it('should return a Express middleware function', () => {
    const mw = handlerFactory.createOne(TourModel);
    expect(typeof mw).toBe('function');
    expect(mw.length).toBe(3);
  });

  // 测试正常返回
  it('return 201 when document is updated', async () => {
    // arrange
    const fakeDoc = { name: 'newDoc', price: 5, duration: 2 };
    TourModel.create.mockResolvedValueOnce(fakeDoc);
    const { req, res, next } = createHttpMocks(undefined, {
      name: 'newDoc',
      price: 5,
      duration: 2,
    });

    // act
    await createOne(req, res, next);

    //assert
    expect(TourModel.create).toHaveBeenCalledWith({
      name: 'newDoc',
      price: 5,
      duration: 2,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { data: fakeDoc },
    });
    expect(next).not.toHaveBeenCalled();
  });

  // 测试数据库异常
  it('calls catchAsync error', async () => {
    // arrange
    const dbErr = new Error('DB crashed');
    TourModel.create.mockRejectedValueOnce(dbErr);
    const { req, res, next } = createHttpMocks('123', { name: '123' });

    // act
    await createOne(req, res, next);

    // assert
    expect(TourModel.create).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled(); // 不应该向客户端发送响应
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(dbErr); // 应把同一个错误对象传给 next
  });
});

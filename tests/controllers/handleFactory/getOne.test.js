const TourModel = require('../../../models/tourModel');
const handlerFactory = require('../../../controllers/handlerFactory');
const createHttpMocks = require('../../helpers/httpMocks');

const getOne = handlerFactory.getOne(TourModel);
const getOnePop = handlerFactory.getOne(TourModel, 'guides'); // 有 populate

jest.mock('../../../models/tourModel.js');

function createQueryStub(result, shouldReject = false) {
  return {
    populate: jest.fn().mockReturnThis(),
    then: undefined, // 防止被当成 Promise
    // 让 await query 返回 result 或抛错
    [Symbol.asyncIterator]: undefined, // 避免 for-await
    // 下面这个 trick：把对象直接当 Promise
    // await 对象时，会调用 .then(resolve, reject)
    // eslint-disable-next-line no-dupe-keys
    then: (res, rej) => (shouldReject ? rej(result) : res(result)),
  };
}

/* ------------------------------------------------------------------ */
/* factory.getOne                                                  */
/* ------------------------------------------------------------------ */
describe('factory.getOne', () => {
  afterEach(() => jest.clearAllMocks());

  // 测试返回是否是 middleware
  it('should return a Express middleware function', () => {
    const mw = handlerFactory.getOne(TourModel);
    expect(typeof mw).toBe('function');
    expect(mw.length).toBe(3);
  });

  // 测试正常返回
  it('return 200 when document is updated', async () => {
    // arrange
    const fakeDoc = { _id: 'abc' };
    TourModel.findById.mockResolvedValueOnce(fakeDoc);
    const { req, res, next } = createHttpMocks('123');

    // act
    await getOne(req, res, next);

    //assert
    expect(TourModel.findById).toHaveBeenCalledWith('123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { data: fakeDoc },
    });
    expect(next).not.toHaveBeenCalled();
  });

  // 测试正常返回并包含 populate
  it('200 with doc and populate called', async () => {
    const doc = { id: '2', name: 'populated tour' };
    const queryStub = createQueryStub(doc);
    TourModel.findById.mockReturnValue(queryStub);

    const { req, res, next } = createHttpMocks('2');

    await getOnePop(req, res, next);

    expect(TourModel.findById).toHaveBeenCalledWith('2');
    expect(queryStub.populate).toHaveBeenCalledWith('guides');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { data: doc },
    });
  });

  // 测试返回 404
  it('calls next(err404) when no document found', async () => {
    // arrange
    TourModel.findById.mockResolvedValueOnce(null);
    const { req, res, next } = createHttpMocks('null');
    // act
    await getOne(req, res, next);

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
    TourModel.findById.mockRejectedValueOnce(dbErr);
    const { req, res, next } = createHttpMocks('123');

    // act
    await getOne(req, res, next);

    // assert
    expect(TourModel.findById).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled(); // 不应该向客户端发送响应
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(dbErr); // 应把同一个错误对象传给 next
  });
});

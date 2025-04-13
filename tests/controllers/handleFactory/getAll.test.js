const APIFeatures = require('../../../utils/apiFeatures'); // ← 已被 mock
const ReviewModel = require('../../../models/reviewModel'); // 假设测 review
const handlerFactory = require('../../../controllers/handlerFactory');
const createHttpMocks = require('../../helpers/httpMocks');

const getAll = handlerFactory.getAll(ReviewModel);

jest.mock('../../../models/reviewModel.js'); // 只需要 ReviewModel.find 是 jest.fn()
jest.mock('../../../utils/apiFeatures', () =>
  // 这里返回一个构造器函数
  jest.fn().mockImplementation((queryArg, queryString) => {
    const chain = {
      queryArg,
      queryString,
      filter: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limitFileds: jest.fn().mockReturnThis(),
      paginate: jest.fn().mockReturnThis(),
      query: Promise.resolve([]), // 默认成功返回空数组
    };
    return chain;
  }),
);

afterEach(() => jest.resetAllMocks());

it('returns 200 with docs list (no tourId)', async () => {
  // 1) Model.find 返回一个占位 query 对象
  const dummyQuery = {};
  ReviewModel.find.mockReturnValue(dummyQuery);

  // 2) 让 APIFeatures 的实例 .query resolve docs
  const docs = [{ id: 1 }, { id: 2 }];
  APIFeatures.mockImplementationOnce((qArg, qStr) => ({
    queryArg: qArg,
    queryString: qStr,
    filter: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limitFileds: jest.fn().mockReturnThis(),
    paginate: jest.fn().mockReturnThis(),
    query: Promise.resolve(docs),
  }));

  const { req, res, next } = createHttpMocks(undefined, {}, { sort: 'price' });

  await getAll(req, res, next);

  expect(ReviewModel.find).toHaveBeenCalledWith({});
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({
    status: 'success',
    results: docs.length,
    data: { docs },
  });
  expect(next).not.toHaveBeenCalled();
});

it('adds filter {tour: tourId} when req.params.tourId exists', async () => {
  const dummyQuery = {};
  ReviewModel.find.mockReturnValue(dummyQuery);

  APIFeatures.mockImplementationOnce(() => ({
    filter: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limitFileds: jest.fn().mockReturnThis(),
    paginate: jest.fn().mockReturnThis(),
    query: Promise.resolve([]),
  }));

  const { req, res, next } = createHttpMocks(undefined, {}, {});
  req.params = { tourId: 'abc123' };

  await getAll(req, res, next);

  expect(ReviewModel.find).toHaveBeenCalledWith({ tour: 'abc123' });
  expect(res.status).toHaveBeenCalledWith(200);
});

it('forwards error when query rejects', async () => {
  ReviewModel.find.mockReturnValue({}); // 占位 query

  const dbErr = new Error('DB down');
  APIFeatures.mockImplementationOnce(() => ({
    filter: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limitFileds: jest.fn().mockReturnThis(),
    paginate: jest.fn().mockReturnThis(),
    query: Promise.reject(dbErr),
  }));

  const { req, res, next } = createHttpMocks();

  await getAll(req, res, next);

  expect(next).toHaveBeenCalledWith(dbErr);
  expect(res.status).not.toHaveBeenCalled();
});

function createHttpMocks(id = undefined, body = {}, query = {}) {
  const req = { body, query, params: {} }; // 始终保证 params 存在
  if (id !== undefined) req.params.id = id; // 需要 id 时再挂上

  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  const next = jest.fn();

  return { req, res, next };
}

module.exports = createHttpMocks;

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString }; // 深拷贝，生成新的Object
    const excludeFields = ['page', 'limit', 'sort', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]); //删除不需要匹配的字段

    // Advance filtering: 匹配大于小于等范围
    let queryStr = JSON.stringify(queryObj); //转字符串
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // g代表多次匹配，callback将每次匹配到的字段加上$符号
    this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join(' '); // 去掉逗号换为空格
      this.query = this.query.sort(sortBy); // 根据sort对应的字段进行排序
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFileds() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // 不将mongodb默认生成的__v字段返回，-代表不包括
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // 默认值，* 1是因为可以将字符串转换为数字
    const limit = this.queryString.limit * 1 || 100; // 默认值
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;

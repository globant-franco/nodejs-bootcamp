class APIFeatures {
  constructor(query, model) {
    this.query = query;
    this.model = model;
  }

  filter() {
    // Filtering
    // QUery string example duration[gte]=5&difficulty=easy
    const queryObj = { ...this.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((key) => delete queryObj[key]);

    // 2) Advanced filtering
    // Convert filters to mongoose format, like {$gte=5}
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);

    //let query = Tour.find(JSON.parse(queryStr));
    this.model = this.model.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // 3) Sorting
    if (this.query.sort) {
      // Giving -sortProperty will sort in descending order
      // You can pass multiple properties like: sort=-price,ratingAverage
      const sortBy = this.query.sort.split(',').join(' ');
      this.model = this.model.sort(sortBy);
    } else {
      this.model = this.model.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // 4) Field limiting, this is also called projection filtering
    //example of query string fields=name,duration,price
    // you can also pass -name, -duration which means all fields
    // except name and duration
    if (this.query.fields) {
      const fields = this.query.fields.split(',').join(' ');
      this.model = this.model.select(fields);
    } else {
      // the minus means that all fields except __v
      this.model = this.model.select('-__v');
    }
    return this;
  }

  pagination() {
    // 5) Pagination
    //skip: page=2&limit=10 1-10 -> page1, 11-20 -> page2, 21-30 -> page3
    const page = this.query.page * 1 || 1;
    const limit = this.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.model = this.model.skip(skip).limit(limit);

    // if (this.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) {
    //     return res.status(404).json({
    //       status: 'fail',
    //       message: 'This page does not exist',
    //     });
    //   }
    // }
    return this;
  }
}

module.exports = APIFeatures;

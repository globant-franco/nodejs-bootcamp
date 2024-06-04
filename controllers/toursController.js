//const fs = require('fs');
//const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json'));
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// This middleware is called before getTours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(req.query, Tour)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const tours = await features.model;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // same as Tour.findOne({_id: req.params.id})
  // Calling .next here will jump into the global middleware
  if (!tour) return next(new AppError('Tour not found', 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) return next(new AppError('Tour not found', 404));

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // send back the new updated tour object
    runValidators: true, // run the validators on the updated object
  });

  if (!tour) return next(new AppError('Tour not found', 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
});

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

// exports.checkID = (req, res, next, value) => {
// const tour = tours.find((ele) => ele.id === value);

// if (!tour) {
//   return res.status(404).json({ status: 'fail', message: 'Tour not found' });
// }

//next();
// };

exports.getTourStats = catchAsync(async (req, res, next) => {
  // Aggregation Pipeline
  // Receives an array of stages
  const stats = await Tour.aggregate([
    {
      // match is for doing queries
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: null, // this is to have all in one single group, you can user for instance any field name, '$difficulty', or $toUpper: '$difficulty' to uppercase the field name
        numTours: { $sum: 1 }, //every doc counts as one and sum
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: -1 }, // sort by avgRating in descending order
    },
    //{
    //$match: { _id: { $ne: 'EASY' } }, // to use this one the above match must have the key difficulty
    //},
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

// Counts how many tours there are each month for a given year
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  // unwind desconstruct array field and output each element individually
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 }, // exclude _id from results
    },
    {
      $sort: { numTours: -1 }, // sort by numTours in descending order
    },
    //{
    //$limit: 12, // limit to 12 months just for education purposes
    //},
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

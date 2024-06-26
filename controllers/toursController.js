//const fs = require('fs');
//const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json'));
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// Let's have the image stored as a buffer so we can do the resizing
// setting this allows us to have access to the image at req.file.buffer
const multerStorage = multer.memoryStorage();

// Here we check if the file is really an image, this callback is the same as the one
// we specify in the `destination` and `filename` options for the multerStorage
const multerFilter = (req, file, callbackFn) => {
  if (file.mimetype.startsWith('image')) {
    callbackFn(null, true);
  } else {
    callbackFn(
      new AppError('Not an image! Please upload only images.', 400),
      false
    );
  }
};

//const upload = multer({ dest: 'public/img/users' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// upload.fields is when we have multiple files for multiple fields
// it will make file available through `req.files`
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.images || !req.files.imageCover) {
    return next();
  }

  // Process tour image Cover
  if (req.files.imageCover) {
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  // Process tour images
  if (req.files.images) {
    req.body.images = [];
    // Super important to understand why to use Promise.all here.
    // And the reason is because inside loops async functions are delegated to the event loop
    // the rest of the code is executed, meaning that req.body.images
    // will be empty when moving to the next middleware to update the tour
    // when using Promise.all we wait until all promises are fullfield
    // and then making sure req.body.images is set
    await Promise.all(
      req.files.images.map(async (image, index) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${
          index + 1
        }.jpeg`;

        await sharp(image.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    );
  }

  next();
});

// In case we only had one field for multiple images
//upload.array('images', 5)

// This middleware is called before getTours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getTours = factory.getAll(Tour);

exports.createTour = factory.createOne(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) return next(new AppError('Tour not found', 404));

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });
exports.deleteTour = factory.deleteOne(Tour);

exports.updateTour = factory.updateOne(Tour);

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

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/8/center/-6,24/unit/kms
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // input that the centerSphere option needs and that needs to be
  // defined in radians
  // 1 mile = 1.609344 kilometers
  // radius of the earth in miles is 3963.2
  // radius of the earth in kilometers is 6378.1
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    // 400 Bad request
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  // startLocation is a common queried field, remember it needs to be indexed
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lat, lng], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// /distances/:latlng/unit/:unit
// This endpoint will return how much distance there is between my location
//  and the tour's location
// BE CAREFUL with aggregation pipeline and the aggregate hooks you define
// in your model, you might errors like $geoNear was not the first stage in the pipeline after optimization.
// Remember there is a pre aggregate hook that add a match to the beginning of
// each aggregator indicating to exclude secret tours from the results
exports.getDistances = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    // 400 Bad request
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      // geoNear is the only aggregation pipeline that exists
      // it also requires a geospatial index
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lat * 1, lng * 1],
        },
        distanceField: 'distance', // name of the field that's gonna be created and where we're gonna store the results
        // the result of distance comes in meters!
        distanceMultiplier: multiplier,
      },
    },
    // in project we specify the fields that we want to query
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

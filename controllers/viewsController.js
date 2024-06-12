const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1 Get tour data form collection
  const tours = await Tour.find();

  // 2 Build Template

  // 3 Render that template using the data from 1
  res.status(200).render('overview', { title: 'All Tours', tours });
});

exports.getTour = (req, res) => {
  res.status(200).render('tour', { title: 'The Forest Hiker' });
};
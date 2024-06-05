const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
///this factoryy file will return the handlers for our CRUD controller operations
// this factory returns another function
// Used for deleing reviews and users
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) return next(new AppError(`Document not found`, 404));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // send back the new updated document object
      runValidators: true, // run the validators on the updated object
    });

    if (!document) return next(new AppError('document not found', 404));

    res.status(200).json({
      status: 'success',
      data: {
        document: document,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        document,
      },
    });
  });

exports.getOne = (Model, populateOpts) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOpts) query = query.populate(populateOpts);
    // Be careful when you call populate and there are pre find hooks in other models
    // because it will fetch additional data resulting in a lot of nesting data
    // calling populate('guides') is the same as populate('{path: 'guides'}')
    // You could use virtual field to populate nested resource, check Tour.reviews
    const document = await query;
    // same as Model.findOne({_id: req.params.id})
    // Calling .next here will jump into the global middleware
    if (!document) return next(new AppError('Document not found', 404));

    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // ugly hack for nested resources, like tours/:tourId/reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(req.query, Model.find(filter))
      .filter()
      .sort()
      .limitFields()
      .pagination();
    // calling features.model.explain() will return the explain of the query
    // const documents = await features.model.explain();

    const documents = await features.model;

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        documents,
      },
    });
  });

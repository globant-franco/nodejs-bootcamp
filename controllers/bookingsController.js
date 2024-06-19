const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('./../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1 Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError(`Tour not found`, 404));

  // 2 create checkout session

  // in the success_url we're gonna pass the tour, user, and price in order
  // to create a Booking record, that's kind of a hack because with stripe webhooks
  // we could do the same, nevertheless webhooks are only supported in production
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email, // this a protected route so user is available through req.user,
    client_reference_id: req.params.tourId, // this is to be used later to save the booking in the DB along with user and price
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // 3 create session as response and sent it to the client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // this is temporary because it's unsecure, anyone could guess the
  // query string and book tours without paying
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) return next();

  await Booking.create({ tour, user, price });

  // On payment success we tell stripe to redirect to /?tour=123,user=6442,price-332
  // so we need to remove the query string and redirect to /
  res.redirect(req.originalUrl.split('?')[0]);
});

// CRUD Operations
exports.getBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);

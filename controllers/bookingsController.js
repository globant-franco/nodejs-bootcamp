const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('./../models/bookingModel');
const User = require('./../models/userModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1 Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError(`Tour not found`, 404));

  // 2 create checkout session

  // in the success_url we're gonna pass the tour, user, and price in order
  // to create a Booking record, that's kind of a hack because with stripe webhooks
  // we could do the same, nevertheless webhooks are only supported in production
  const base_url = `${req.protocol}://${req.get('host')}`;
  const success_url =
    process.env.NODE_ENV === 'production'
      ? `${base_url}/my-tours?alert=booking`
      : `${base_url}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`; // this a protected route so user is available through req.user,

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: success_url,
    cancel_url: `${base_url}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId, // this is to be used later to save the booking in the DB along with user and price
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`${base_url}/img/tours/${tour.imageCover}`],
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
  // this workaround is only for development
  if (process.env.NODE_ENV !== 'production') {
    // this is temporary because it's unsecure, anyone could guess the
    // query string and book tours without paying
    const { tour, user, price } = req.query;
    if (!tour || !user || !price) return next();

    await Booking.create({ tour, user, price });

    // On payment success we tell stripe to redirect to /?tour=123,user=6442,price-332
    // so we need to remove the query string and redirect to /
    res.redirect(req.originalUrl.split('?')[0]);
  }
  next();
});

const createBookingFromStripe = async (session) => {
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email }).id;
  const price = session.display_items[0].price_data.unit_amount / 100;

  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['signature'];
  let event;
  try {
    // remember req.body needs to be in raw format
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      createBookingFromStripe(event.data.object);
    }
    res.status(200).json({ received: true });
  } catch (e) {
    // Send error to stripe
    return res.status(400).send(`Webhook error: ${e.message}`);
  }
};

// CRUD Operations
exports.getBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);

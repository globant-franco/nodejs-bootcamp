import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  // 1 Get checkout session from server
  try {
    const stripe = Stripe(
      'pk_test_51PT4TiCLmrW63PXJ738aRlpw5NFVXZ93afTWICA3WhFWNpAgIwM1ry6I2GjhxrXTnL7jpOe7gEzxDFoUkgJ5EZqa00MBNaFtqc'
    );
    const session = await axios({
      method: 'GET',
      url: `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`,
    });

    // 2 Use Stripe to create a checkout form and charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};

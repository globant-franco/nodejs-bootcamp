import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'post',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });
    if (res.data.status === 'success') {
      // Redirect user to home page
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 500);
    }
    //console.log('response is', res);
  } catch (err) {
    //console.log('error logging in:', err.response.data);
    showAlert('error logging in:', err.response.data.message);
  }
};

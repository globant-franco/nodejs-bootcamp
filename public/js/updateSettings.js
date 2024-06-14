import axios from 'axios';
import { showAlert } from './alerts';

export const updateUserSettings = async (email, name) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/submit-user-data',
      data: {
        email,
        name,
      },
    });
    if (res.status === 200) {
      // location.reload(true);
      showAlert('success', 'User data updated successfully');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

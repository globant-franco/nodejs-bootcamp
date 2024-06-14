import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateUserSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://localhost:3000/api/v1/users/updateMyPassword'
        : 'http://localhost:3000/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.status === 200) {
      // location.reload(true);
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

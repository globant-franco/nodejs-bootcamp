import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateUserSettings } from './updateSettings';
import { bookTour } from './stripeUtils';
import { showAlert } from './alerts';

window.onload = function () {
  const loginForm = document.querySelector('.form--login');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      login(email, password);
    });
  }

  const updateSettingsForm = document.querySelector('.form-user-data');
  if (updateSettingsForm) {
    updateSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData();
      form.append('name', document.getElementById('name').value);
      form.append('email', document.getElementById('email').value);
      form.append('photo', document.getElementById('photo').files[0]);
      updateUserSettings(form, 'data');
    });
  }

  const updatePasswordForm = document.querySelector('.form-user-settings');
  if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;

      let saveButton = document.querySelector('.btn--save-password');
      saveButton.textContent = 'Updating...';

      await updateUserSettings(
        { passwordCurrent, password, passwordConfirm },
        'password'
      );

      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
      saveButton.textContent = 'Save Password';
    });
  }

  const mapBox = document.getElementById('map');
  if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);

    if (locations) {
      displayMap(locations);
    }
  }

  const logoutBtn = document.querySelector('.nav__el--logout');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const bookBtn = document.getElementById('book-tour');
  if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
      e.target.textContent = 'Processing...';
      const tourId = e.target.dataset.tourId; // if we specify data-tour-id then it's available as dataset.tourId
      // or you can also use const const { tourId } = e.target.dataset
      bookTour(tourId);
    });
  }

  const alertMessage = document.querySelector('body').dataset.alert;
  if (alertMessage) showAlert('success', alertMessage, 20);
};

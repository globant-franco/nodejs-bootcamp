import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateUserSettings } from './updateSettings';

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
      const email = document.getElementById('email').value;
      const name = document.getElementById('name').value;
      updateUserSettings({ email, name }, 'data');
    });
  }

  const updatePasswordForm = document.querySelector('.form-user-settings');
  if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;

      updateUserSettings(
        { passwordCurrent, password, passwordConfirm },
        'password'
      );
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
};

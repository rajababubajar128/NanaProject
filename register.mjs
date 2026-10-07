import './firebase-auth.mjs';

const form = document.getElementById('register-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('register-submit');
const status = document.getElementById('register-status');

form.addEventListener('submit', async event => {
  event.preventDefault();
  submitButton.disabled = true;
  status.dataset.kind = '';
  status.textContent = '';

  try {
    const username = usernameInput.value.trim().toLowerCase();
    const user = await window.firebaseSignUpUsername(username, passwordInput.value);
    await window.firebaseSignOut();
    status.dataset.kind = 'info';
    status.textContent = `Account created for ${user.displayName}. Sign in with this username and password.`;
    form.reset();
  } catch (error) {
    status.textContent = error.code === 'auth/email-already-in-use'
      ? 'That username is already registered.'
      : error.code === 'auth/weak-password'
        ? 'Firebase requires a password with at least 6 characters.'
        : error.message || 'Unable to create the account.';
  } finally {
    submitButton.disabled = false;
  }
});

import './firebase-auth.mjs';

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const forgotPasswordLink = document.getElementById('forgot-password');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const title = document.getElementById('form-title');
const subtitle = document.getElementById('form-subtitle');
const submitButton = document.getElementById('submit-button');
const status = document.getElementById('status');
let mode = 'login';

function setMode(nextMode) {
  mode = nextMode;
  const signingUp = mode === 'signup';
  loginTab.setAttribute('aria-selected', String(!signingUp));
  signupTab.setAttribute('aria-selected', String(signingUp));
  title.textContent = signingUp ? 'Create an account' : 'Admin portal';
  subtitle.textContent = signingUp
    ? 'New accounts have standard access. Admin access must be granted separately.'
    : 'Sign in with your Firebase email account.';
  submitButton.textContent = signingUp ? 'Create account' : 'Log in';
  passwordInput.autocomplete = signingUp ? 'new-password' : 'current-password';
  status.textContent = '';
}

loginTab.addEventListener('click', () => setMode('login'));
signupTab.addEventListener('click', () => setMode('signup'));
forgotPasswordLink.addEventListener('click', async event => {
  event.preventDefault();
  const email = emailInput.value.trim();
  status.dataset.kind = '';
  if (!email) {
    status.textContent = 'Enter your registered email address first.';
    emailInput.focus();
    return;
  }
  try {
    await window.firebaseSendPasswordResetEmail(email);
    status.dataset.kind = 'info';
    status.textContent = 'If this email is registered, Firebase will send a password reset link.';
  } catch (error) {
    status.textContent = error.code === 'auth/invalid-email'
      ? 'Enter a valid email address.'
      : error.message || 'Unable to send the password reset email.';
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  status.dataset.kind = '';
  status.textContent = '';
  submitButton.disabled = true;

  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (mode === 'signup') {
      const user = await window.firebaseSignUp(email, password);
      await window.firebaseSignOut();
      status.dataset.kind = 'info';
      status.textContent = `Account created for ${user.email}. It has standard access, not admin access.`;
      form.reset();
      return;
    }

    const user = await window.firebaseSignIn(email, password);
    const token = await user.getIdToken(true);
    const response = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
    const account = await response.json().catch(() => ({}));
    if (!response.ok || account.role !== 'admin') {
      await window.firebaseSignOut();
      throw new Error('This Firebase account does not have administrator access.');
    }
    sessionStorage.setItem('pana-login-active', '1');
    window.location.replace('/index.html');
  } catch (error) {
    status.textContent = error.code === 'auth/email-already-in-use'
      ? 'An account already exists for this email. Log in instead.'
      : error.code === 'auth/weak-password'
        ? 'Firebase requires a password with at least 6 characters.'
        : error.message || 'Unable to complete sign in.';
  } finally {
    submitButton.disabled = false;
  }
});

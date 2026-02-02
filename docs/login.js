import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  getFirestore
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyClOhEXpKSOHjyhdXm9vrWi-XvBPP8OpJM",
  authDomain: "give-a-tip.firebaseapp.com",
  projectId: "give-a-tip",
  storageBucket: "give-a-tip.firebasestorage.app",
  messagingSenderId: "177375336520",
  appId: "1:177375336520:web:2f53a6f95dbe4b753d207d",
  measurementId: "G-06X0NRB6H2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/////////////////////////////////
/////////////////////////////////
/////////////////////////////////

const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');

const loginContainer = document.getElementById('loginContainer');
const registerContainer = document.getElementById('registerContainer');


loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginContainer.classList.add('active');
  registerContainer.classList.remove('active');
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerContainer.classList.add('active');
  loginContainer.classList.remove('active');
});

//////////////////////////////////////
//////////     register     //////////
//////////////////////////////////////

const formReg = document.getElementById('registerForm');
const messageReg = document.getElementById('msgReg');

formReg.addEventListener('submit', async (e) => {
  e.preventDefault();

  // if(emailInputReg.className !== 'valid') return; // terminate submit if not valid

  const formData = new FormData(formReg);
  const payload = Object.fromEntries(formData.entries());

  if (passwordInputReg.value !== confirmPasswordInputReg.value) {
    confirmPasswordInputReg.classList.add('invalid');
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    // ✅ переходим на страницу edit.html
    window.location.href = `./edit.html`;
  } catch (err) {
    // переводим ошибки на человеческий язык
    let msg;
    switch (err.code) {
      case "auth/email-already-in-use":
        msg = "This email is already used";
        break;
      case "auth/invalid-email":
        msg = "Emsil is incorrect";
        break;
      case "auth/weak-password":
        msg = "Password is too weak";
        break;
      default:
        msg = err.message;
    }
    messageReg.textContent = `${msg}`;
    messageReg.classList.remove('active-success');
    messageReg.classList.add('active-error');
    registerContainer.classList.add('incorrect');
  }
});

/////////////////////////////////////////////
//////////     login / sign in     //////////
/////////////////////////////////////////////

const formLog = document.getElementById('loginForm');
const messageLog = document.getElementById('msgLog');

formLog.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(formLog);
  const payload = Object.fromEntries(formData.entries());

  console.log(payload.email);
  console.log(payload.password);

  try {
    await signInWithEmailAndPassword(auth, payload.email, payload.password);
    // ✅ переходим на страницу edit.html
    window.location.href = `./edit.html`;
  } catch (err) {
    messageLog.textContent = `${err.message}`;
    messageLog.classList.remove('active-success');
    messageLog.classList.add('active-error');
    loginContainer.classList.add('incorrect');
  }
});

///////////////////////////////////////////////
//////////     Input error reset     //////////
///////////////////////////////////////////////

// const allInputs = document.querySelectorAll('input');

// allInputs.forEach((el) => el.addEventListener('input', () => {
//   if(el.value === '') {
//     el.classList.remove('invalid');
//   }
// }));

emailInputReg.addEventListener('input', () => {
  emailInputReg.closest('.incorrect').querySelector('.active-error').classList.remove('active-error');
  emailInputReg.closest('.incorrect').classList.remove('incorrect');
});

passwordInputReg.addEventListener('input', () => {
  passwordInputReg.closest('.incorrect').querySelector('.active-error').classList.remove('active-error');
  passwordInputReg.closest('.incorrect').classList.remove('incorrect');
});
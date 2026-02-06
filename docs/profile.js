const path = window.location.pathname;
const username = path.split('/')[1]; // убираем "/" из строки "/username"
console.log(username);

///////////////////////////////////
///////////////////////////////////

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB9ekJy28TCq-CsQh3fb0ibyIgPZbEIpxo",
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

///////////////////////////////////
///////////////////////////////////

async function loadProfile() {
  const container = document.getElementById("profile");

  if (!username) {
    container.innerHTML = `
      <p class="error">Username is missing...</p>
      <a class="close" href="./index.html"><img src="./images/chevron-left.svg"><span>Back</span></a>
    `;
    return;
  }

  // ищем курьера по username
  const q = query(collection(db, 'couriers'), where('username', '==', username));
  const dbSnapshot = await getDocs(q);
  
  if (dbSnapshot.empty) {
    container.innerHTML = `
      <p>Oops. We can't find this courier now...</p>
      <a class="close" href="./index.html"><img src="./images/chevron-left.svg"><span>Back</span></a>
    `;
    return; // прерываем всё
  }
  
  const data = dbSnapshot.docs[0].data();

  /////////////////////////////////
  // data for button and QR code
  /////////////////////////////////

  // let buttonLink = data.buttonLink[0] || data.bankLink;
  // let buttonLabel = data.buttonLabel[0] || "Give a Tip";

  let buttonsHTML = '';

  for (let i=0; i < data.buttonLabel.length; i++) {
    buttonsHTML += `
    <div class="profile-btn-row">
      <a href="${data.buttonLink[i]}" target="_blank" class="btn">${data.buttonLabel[i]}</a>
      <div class="light-btn" id="qrCodeBtn_${[i]}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" fill="currentColor"></rect>
          <rect x="14" y="3" width="7" height="7" fill="currentColor"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7" fill="currentColor"></rect>
        </svg>
      </div>
    </div>
    `;
  }

  //////////////////////////////////////////////////////////////////////
  // default avatar generation
  //////////////////////////////////////////////////////////////////////

  // Упрощённая проверка на emoji (не охватывает все, но работает хорошо)
  function isEmoji(char) {
    const emojiRegex = /\p{Extended_Pictographic}/u;
    return emojiRegex.test(char);
  }

  function getTwoLetters(input) {
    if (typeof input !== 'string') return '';
    // Разбиваем строку по символам, включая emoji
    const chars = Array.from(input);
    // Фильтр: оставляем только буквы (латиница, кириллица) и emoji
    const validChars = chars.filter(char =>
      /[a-zа-яё0-9]/i.test(char) || isEmoji(char)
    );
    if (validChars.length === 0) return '';
    if (validChars.length === 1) return validChars[0].toUpperCase?.() || validChars[0];
    const first = validChars[0].toUpperCase?.() || validChars[0];
    const last = validChars[validChars.length - 1].toUpperCase?.() || validChars[validChars.length - 1];
    return first + last;
  }

  /////////////////

  let avaLetters = getTwoLetters(data.name);
  let randomHUE = Math.floor(Math.random() * 361);
  let avatarImg = `
    <div style="background-color: hsl(${randomHUE}deg 25% 85%);">
      <span style="color: hsl(${randomHUE}deg 30% 50% / 0.75);">${avaLetters}</span>
    </div>
  `;

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////

  // если есть ссылка на аватар, то заменяем дефолтный аватар на картинку
  if (data.avatarLink) {
    avatarImg = `<img src="${data.avatarLink}">`;
  }

  // собираем профиль из полученных данных
  container.innerHTML = `
    <div id="profileData">
      <div class="avatar">${avatarImg}</div>
      <h1>${data.name}</h1>
      <p>${data.message}</p>
      <div class="profile-btn-group">${buttonsHTML}</div>
    </div>
    <div class="button-container">
      <a class="light-btn close" href="./index.html"><img src="./images/chevron-left.svg"><span>Back</span></a>
    </div>
    <div class="qr-container">
      <canvas id="qrCode"></canvas>
      <p>${data.buttonLink[0]}</p>
    </div>
  `;

  // QR code button setup
  qrCodeButtonSetup(data.buttonLink[0]);
}

loadProfile();

//////////////////////////////////////
/////    secure link redirect    /////
//////////////////////////////////////

let optionBtnLink = document.querySelector('#optionBtn a');

optionBtnLink.addEventListener('click', () => secureRedirectLink('./edit.html', './login.html'));

function secureRedirectLink(editLink, loginLink) {
  onAuthStateChanged(auth, user => {
    if (user) {
      optionBtnLink.href = editLink;
    } else {
      optionBtnLink.href = loginLink;
    }
  });
}

///////////////////////////////////
/////   QR code generation    /////
///////////////////////////////////

// Минималистичная библиотека QR генерации (QR Code generator v1)
// Взята из проекта: https://github.com/nayuki/QR-Code-generator (адаптирована)
class QR {
  static generate(text, size = 2048) {
    const canvas = document.getElementById('qrCode');
    const ctx = canvas.getContext('2d');
    const qr = QR._encode(text);
    const cellSize = Math.floor(size / qr.length);
    const margin = (size - cellSize * qr.length) / 2;

    canvas.width = canvas.height = size;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    for (let y = 0; y < qr.length; y++) {
      for (let x = 0; x < qr.length; x++) {
        if (qr[y][x]) {
          ctx.fillRect(margin + x * cellSize, margin + y * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  static _encode(text) {
    // Используем готовую библиотеку qrcode-generator (встроено)
    const qr = qrcode(0, 'L');
    qr.addData(text);
    qr.make();
    const size = qr.getModuleCount();
    const data = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(qr.isDark(r, c));
      }
      data.push(row);
    }
    return data;
  }
}

// Вставляем библиотеку qrcode-generator (CDN)
// const script = document.createElement('script');
// script.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
// script.onload = () => console.log('QR Library Loaded');
// document.head.appendChild(script);

///////////////////////////////////

function generateQRCode(xxx) {
  if (!xxx) return; // terminate if empty
  QR.generate(xxx);
}

function qrCodeButtonSetup(bankLink) {
  let qrContainer = document.querySelector('.qr-container');
  let qrCodeBtn = document.querySelector('#qrCodeBtn_1'); //////////////////////////////// !!!!!!!!!!!!

  qrCodeBtn.addEventListener('click', ()=>{
    if(!bankLink) return; // terminate if empty
    generateQRCode(bankLink);
    qrContainer.classList.add('active');
    // profileData.classList.add('hidden');
  });

  qrContainer.addEventListener('click', ()=>{
    qrContainer.classList.remove('active');
    // profileData.classList.remove('hidden');
  });
}
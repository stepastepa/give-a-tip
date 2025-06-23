const params = new URLSearchParams(window.location.search);
const username = params.get("username"); // получаем юзернейм из ссылки

console.log(username);

///////////////////////////////////
///////////////////////////////////

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import {
  getAuth
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
      <a class="close" href="${location.origin}"><img src="./images/chevron-left.svg"><span>Back</span></a>
    `;
    return;
  }

  // ищем курьера по username
  const q = query(collection(db, 'couriers'), where('username', '==', username));
  const dbSnapshot = await getDocs(q);
  
  if (dbSnapshot.empty) {
    container.innerHTML = `
      <p>Oops. We can't find this courier now...</p>
      <a class="close" href="${location.origin}"><img src="./images/chevron-left.svg"><span>Back</span></a>
    `;
    return; // прерываем всё
  }
  
  const data = dbSnapshot.docs[0].data();

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
    <div class="avatar">${avatarImg}</div>
    <h1>${data.name}</h1>
    <p>${data.message}</p>
    <a href="${data.bankLink}" target="_blank" class="btn">Give a Tip</a>
    <a class="close" href="${location.origin}"><img src="./images/chevron-left.svg"><span>Back</span></a>
  `;
}

loadProfile();
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  getFirestore,
  collection,
  getDocs
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

////////////////////////////////////////////////
////////////////////////////////////////////////

const searchResults = document.getElementById('searchResults');

////////////////////////////////////////////////
/////     activate searchbar animation     /////
////////////////////////////////////////////////

const searchInput = document.getElementById('searchInput');
const inputBox = document.querySelector('.search-bar');
const mainWrapper = document.querySelector('.wrapper');

searchInput.addEventListener('input', () => {
  if(searchInput.value !== '') {
    inputBox.classList.add('active');
  } else if (!searchInput.value) {
    inputBox.classList.remove('active');
  }
});

const isProbablyMobileWithKeyboard = () =>
  'ontouchstart' in window &&
  /iPhone|Android|Mobile|iPad/i.test(navigator.userAgent);

if (isProbablyMobileWithKeyboard()) {
  inputBox.classList.add('mobile');
}
/*
// высота видимой области браузера с включенной клавиатурой
function getVisibleHeight() {
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  return window.innerHeight;
}

function onKeyboardChange() {
  const visibleHeight = getVisibleHeight();
  mainWrapper.style.setProperty('--result-height', `calc(${visibleHeight}px - 2rem - (1.5rem + 2rem))`);
  mainWrapper.style.setProperty('--height', `${visibleHeight}px`);
}

// Следим за появляющейся клавиатурой
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', onKeyboardChange);
} else {
  window.addEventListener('resize', onKeyboardChange);
}

// рассчитываем высоту экрана (с клавиатурой) при нажатии на поиск
searchInput.addEventListener('focus', () => {
  onKeyboardChange();
});
*/
//////////////////////////////////////////////////
// скрываем экранную клавиатуру при скролле

function removeInputFocusOnScroll() {
  // Проверим: есть ли активный элемент (и это input или textarea)
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
    active.blur(); // Снимет фокус, скроет клавиатуру
  }
}

// скролл всей страницы
window.addEventListener('scroll', () => {
  removeInputFocusOnScroll();
}, { passive: true });
// скролл элемента с результатом поиска
searchResults.addEventListener('scroll', () => {
  removeInputFocusOnScroll();
}, { passive: true });

/////////////////////////////
/////     searching     /////
/////////////////////////////

// получаем отфильтрованный список курьеров
let couriers = [];

let dbSnapshot = '';
async function getSnapshot() {
  dbSnapshot = await getDocs(collection(db, 'couriers'));
}
getSnapshot();

async function showResults(query) {
  couriers = []; // стираем список

  // ищем курьеров по имени и создаём список
  dbSnapshot.forEach(doc => {
    const data = doc.data();
    if(data.name.toLowerCase().includes(query.toLowerCase())) {
      let courier = {};
      courier.username = data.username;
      courier.name = data.name;
      couriers.push(courier);
    }
  });

  if (couriers.length === 0) {
    searchResults.innerHTML = `Can't find courier... 😞`;
    inputBox.classList.add('empty');
  } else {
    searchResults.innerHTML = couriers.map(el =>
      `<a href="./profile.html?username=${el.username}">${el.name}</a>`
    ).join('');
    inputBox.classList.remove('empty');
  }
}

searchInput.addEventListener('input', event => {
  showResults(event.target.value);
  updateMask(); // обновляем маску на скролле !!!
  setTimeout(() => { // еще раз обновляем маску из-за css анимации 0.3s !!!
      updateMask();
  }, 300);
});

/////////////////////////////////////////
/////     dynamic mask gradient     /////
/////////////////////////////////////////

function updateMask() {
  const scrollTop = searchResults.scrollTop; // расстояние от верха прокрученное
  const scrollHeight = searchResults.scrollHeight; // полная высота контента
  const clientHeight = searchResults.clientHeight; // видимая высота "окна"

  const isAtTop = scrollTop <= 0;
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

  let gradient = '';

  if (isAtTop && isAtBottom) {
    // всё помещается и скролл не нужен, его нет у блока
    gradient = "none";
  } else if (isAtTop) {
    // Только нижняя тень
    console.log('top');
    gradient = `linear-gradient(to bottom, black 0%, black calc(100% - 1rem), transparent 100%)`;
  } else if (isAtBottom) {
    // Только верхняя тень
    console.log('bottom');
    gradient = `linear-gradient(to bottom, transparent 0%, black 1rem, black 100%)`;
  } else {
    // Верх и низ
    console.log('middle');
    gradient = `linear-gradient(to bottom, transparent 0%, black 1rem, black calc(100% - 1rem), transparent 100%)`;
  }

  searchResults.style.maskImage = gradient;
  searchResults.style.webkitMaskImage = gradient;
}

searchResults.addEventListener('scroll', updateMask);
window.addEventListener('load', updateMask); // бесполезное, но пусть будет...
window.addEventListener('resize', updateMask); // чтоб обновляло маску при изменении размера окна тоже


/////////////////////////////////
/////    secure redirect    /////
/////////////////////////////////

loginBtn.addEventListener('click', () => secureRedirect('./edit.html', './login.html'));

function secureRedirect(editLink, loginLink) {
  onAuthStateChanged(auth, user => {
    if (user) {
      window.location.href = editLink;
    } else {
      window.location.href = loginLink;
    }
  });
}
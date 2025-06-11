import { secureRedirect } from './secure-redirect.js';

const input = document.querySelector('.searchbox input');
const inputBox = document.querySelector('.search-bar');
// const btn = document.querySelector('.search-bar .btn');

input.addEventListener('input', () => {
  if(input.value !== '') {
    inputBox.classList.add('active');
  } else if (!input.value) {
    inputBox.classList.remove('active');
  }
});

//////////////////////////
/////     search     /////
//////////////////////////

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// получаем список курьеров актуальных
let couriers = [];
async function fetchCouriers() {
  try {
    const res = await fetch('/api/couriers');
    couriers = await res.json();
  } catch (error) {
    console.error('Failed to load couriers', error);
  }
}

function showResults(query) {
  const filtered = couriers.filter(el =>
    el.name.toLowerCase().includes(query.toLowerCase())
  );
  if (filtered.length === 0) {
    searchResults.innerHTML = `Can't find courier... 😞`;
    inputBox.classList.add('empty');
  } else {
    searchResults.innerHTML = filtered.map(el =>
      `<a href="/profile.html?username=${el.username}">${el.name}</a>`
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

fetchCouriers();

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

///////////////////////////////////
/////     secure redirect     /////
///////////////////////////////////

loginBtn.addEventListener('click', () => secureRedirect('/edit', '/login'));
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import {
  getFirestore,
  getDoc,
  doc,
  setDoc
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

/////////////////////////////////
/////////////////////////////////
/////////////////////////////////

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // ищем данные сразу по uid
    const docRef = doc(db, 'couriers', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(data);

      avatarLinkInputEdit.value = data.avatarLink || '';
      usernameInputEdit.value = data.username || '';
      nameInputEdit.value = data.name || '';
      messageInputEdit.value = data.message || '';
      bankLinkInputEdit.value = data.bankLink || '';
      // qr code display
      courierName.innerText = data.name;
      courierMessage.innerText = data.message;
    } else {
      console.warn("Profile is missing");
      // создаём автоматический юзернейм из почты
      let autoUsername = user.email.split('@')[0];
      usernameInputEdit.value = autoUsername;
    }
  } else {
    window.location.href = './login.html';
  }
});

//////////////////////////////////////
/////    на сервер отправляем    /////
//////////////////////////////////////

const editCard = document.querySelector('.edit-card');
const form = document.getElementById('editForm');
const msg = document.getElementById('msgEdit');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    await setDoc(doc(db, 'couriers', auth.currentUser.uid), { // uid в профиле для связи аккаунта и данных, чтоб искать прямо по uid сразу!!!
      username: payload.username,
      name: payload.name,
      message: payload.message,
      bankLink: payload.bankLink,
      avatarLink: payload.avatarLink,
      createdAt: Date.now()
    });
    window.location.href = `./profile.html?username=${payload.username}`;
  } catch (err) {
    msg.textContent = `${err.message}`;
    msg.classList.add('active-error');
    editCard.classList.add('incorrect');
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

// nameInputEdit.addEventListener('input', () => {
//   nameInputEdit.closest('.incorrect').querySelector('.active-error').classList.remove('active-error');
//   nameInputEdit.closest('.incorrect').classList.remove('incorrect');
// });

///////////////////////
/////   logout    /////
///////////////////////

optionBtn.addEventListener('click', async () => {
  await signOut(auth);
  // window.location.href = '/'; // авто редирект на главную, но я решил по ссылке сделать его
});

///////////////////////////////////
/////   QR code generation    /////
///////////////////////////////////

// Минималистичная библиотека QR генерации (QR Code generator v1)
// Взята из проекта: https://github.com/nayuki/QR-Code-generator (адаптирована)
class QR {
  static generate(text, size = 512) {
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
const qrContainer = document.querySelector('.qr-container');

function generateQRCode() {
  const bankLinkText = document.getElementById('bankLinkInputEdit').value;
  if (!bankLinkText.trim()) return; // terminate if empty
  QR.generate(bankLinkText);
}

qrCodeBtn.addEventListener('click', ()=>{
  if(!bankLinkInputEdit.value.trim()) return; // terminate if empty
  generateQRCode();
  qrContainer.classList.add('active');
  editForm.classList.add('hidden');
});

qrContainer.addEventListener('click', ()=>{
  qrContainer.classList.remove('active');
  editForm.classList.remove('hidden');
});
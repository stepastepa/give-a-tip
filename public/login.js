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
  const formData = new FormData(formReg);
  const payload = Object.fromEntries(formData.entries());

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    messageReg.innerHTML = `Success!<a href="/login">Sign in</a>`;
    messageReg.classList.remove('active-error');
    messageReg.classList.add('active-success');
    formReg.reset();
    setTimeout(() => {
      window.location.href = `/login`;
    }, 2000);
  } else {
    messageReg.textContent = `${data.message}`;
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

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('jwtToken', data.token); // сохраняем токен
    window.location.href = '/edit'; // просто переходим, токен на /edit проверим!!!
  } else {
    messageLog.textContent = `${data.message}`;
    messageLog.classList.remove('active-success');
    messageLog.classList.add('active-error');
    loginContainer.classList.add('incorrect');
  }
});

///////////////////////////////////////////////
//////////     Input class reset     //////////
///////////////////////////////////////////////

const allInputs = document.querySelectorAll('input');

// allInputs.forEach((el) => el.addEventListener('input', () => {
//   if(el.value === '') {
//     el.closest('.incorrect').querySelector('.active-error').classList.remove('active-error');
//     el.closest('.incorrect').classList.remove('incorrect');
//   }
// }));

//////////////////////////////////////////////////////
//////////     realtime form validation     //////////
//////////////////////////////////////////////////////

// получаем список всех юзеров
let listOfUsers = [];
async function fetchUsers() {
  try {
    const res = await fetch('/api/listOfUsers');
    listOfUsers = await res.json();
  } catch (error) {
    console.error('Failed to load list of users', error);
  }
}
fetchUsers(); // запрашиваем список всех юзеров

// проверка юзеров
usernameInputReg.addEventListener('input', checkUsername);

function checkUsername() {
  let found = listOfUsers.filter(user => user.username === usernameInputReg.value);
  // console.log(found.length>0?found[0].username:false);
  let isExisted = found.length>0?found[0].username:false;
  if(isExisted) {
    usernameInputReg.classList.remove('valid');
    usernameInputReg.classList.add('invalid');
  } else if(usernameInputReg.value === '') {
    usernameInputReg.classList.remove('valid');
    usernameInputReg.classList.remove('invalid');
  } else {
    usernameInputReg.classList.remove('invalid');
    usernameInputReg.classList.add('valid');
  }
}

// проверка имейлов
emailInputReg.addEventListener('input', checkEmail);

function checkEmail() {
  let found = listOfUsers.filter(user => user.email === emailInputReg.value);
  console.log(found.length>0?found[0].email:false);
  let isExisted = found.length>0?found[0].email:false;
  
  // проверяем написание строки с почтой
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInputReg.value);

  if(isExisted) {
    emailInputReg.classList.remove('valid');
    emailInputReg.classList.add('invalid');
  } else if(emailInputReg.value === '') {
    emailInputReg.classList.remove('valid');
    emailInputReg.classList.remove('invalid');
  } else if(isValidEmail) {
    emailInputReg.classList.remove('invalid');
    emailInputReg.classList.add('valid');
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('jwtToken');

  if (!token) {
    return window.location.href = '/login'; // нет токена —> редирект обратно!!!
  }

  const res = await fetch('/api/edit', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  const data = await res.json();

  if (res.ok) {
    const user = data.user;
    avatarLinkInputEdit.value = user.avatarLink;
    // usernameInputEdit.value = user.username;
    emailInputEdit.value = user.email;
    // passwordInputEdit.value = user.password;
    nameInputEdit.value = user.name;
    messageInputEdit.value = user.message;
    bankLinkInputEdit.value = user.bankLink;
  } else {
    alert('Error: ' + data.error);
    window.location.href = '/login';
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
  console.log(payload);
  const token = localStorage.getItem('jwtToken');

  const res = await fetch('/api/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
               'Authorization': 'Bearer ' + token },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    msg.textContent = 'Profile updated! Redirecting...';
    msg.style.color = 'limegreen';
    msg.classList.add('active-success');
    form.reset();
    setTimeout(() => {
      window.location.href = `/profile.html?username=${data.username}`;
    }, 2000);
  } else {
    msg.textContent = `${data.message}`;
    msg.classList.add('active-error');
    editCard.classList.add('incorrect');
  }
});

///////////////////////////////////////////////
//////////     Input class reset     //////////
///////////////////////////////////////////////

nameInputEdit.addEventListener('input', () => {
  if(nameInputEdit.value === '') {
    nameInputEdit.closest('.incorrect').querySelector('.active-error').classList.remove('active-error');
    nameInputEdit.closest('.incorrect').classList.remove('incorrect');
  }
});

///////////////////////
/////   logout    /////
///////////////////////

optionBtn.addEventListener('click', async () => {
  localStorage.removeItem('jwtToken');
  // window.location.href = '/'; // авто редирект на главную, но я решил по ссылке сделать его
});

////////////////////
/////   AI     /////
////////////////////

async function fetchRandomName() {
  try {
    // Показываем пользователю, что идет процесс
    aiMessage.textContent = 'AI is thinking...';

    const response = await fetch('/api/generate');
    if (!response.ok) {
        throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
    }
    const data = await response.json();

    nameInputEdit.value = data.randomName.firstName + ' ' + data.randomName.lastName; // получаем объект и собираем полное имя
    aiMessage.textContent = ''; // стираем сообщение

  } catch (error) {
    console.error("Не удалось получить имя:", error);
    aiMessage.textContent = 'Произошла ошибка. Попробуйте снова.';
  }
}

aiNameBtn.addEventListener('click', fetchRandomName);
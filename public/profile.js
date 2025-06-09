const params = new URLSearchParams(window.location.search);
const username = params.get("username"); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

async function loadProfile() {
  const container = document.getElementById("profile");

  if (!username) {
    container.innerHTML = `
      <p class="error">Username кур’єра не вказано.</p>
    `;
    return;
  }

  try {
    const res = await fetch(`/api/profile/${username}`);
    if (!res.ok) throw new Error("Oops. We can't find this courier now...");

    const data = await res.json();

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

    // console.log(data.avatarLink);
    if (data.avatarLink) {
      avatarImg = `<img src="${data.avatarLink}">`;
    }

    container.innerHTML = `
      <div class="avatar">${avatarImg}</div>
      <h1>${data.name}</h1>
      <p>${data.message}</p>
      <a href="${data.bankLink}" target="_blank" class="btn">Give a Tip</a>
      <a class="close" href="${location.origin}"><img src="./images/chevron-left.svg"><span>Back</span></a>
    `;
  } catch (err) {
    container.innerHTML = `
      <p class="error">${err.message}</p>
      <a class="close" href="${location.origin}"><img src="./images/chevron-left.svg"><span>Back</span></a>
    `;
  }
}

loadProfile();
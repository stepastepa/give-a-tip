require('dotenv').config(); // Подгружаем .env

const express = require('express');
const jwt = require('jsonwebtoken'); // JWT Token для хранения сессии

const { GoogleGenAI } = require("@google/genai"); // for commonJS
// const { OpenAI } = require('openai'); // for commonJS

const crypto = require('crypto'); // ⚠️ 🟪 для шифрования паролей (default)
const { randomUUID } = require('crypto'); // ⚠️ crypto - генератор имен
const { hashPassword, verifyPassword } = require('./auth'); // 🟪 хэширование

const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser'); // для req.body JSON
const cors = require('cors'); // кросс-доменные запросы (например, если фронт и бэкенд будут на разных доменах/портах)
const app = express();
const PORT = process.env.PORT || 3000;
const secretKey = process.env.JWT_SECRET;
const apiKey = process.env.GEMINI_API_KEY;
const apiKeyBehindthename = process.env.BEHINDTHENAME_API_KEY;

const COURIERS_FILE = path.join(__dirname, 'couriers.json');
let couriers = [];

function loadCouriers() {
  try {
    couriers = JSON.parse(fs.readFileSync(COURIERS_FILE, 'utf8'));
  } catch (err) {
    couriers = [];
  }
}

function saveCouriers() {
  fs.writeFileSync(COURIERS_FILE, JSON.stringify(couriers, null, 2));
}

/*
function removeOldCouriers() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const before = couriers.length;
  couriers = couriers.filter(c => now - c.updatedAt < oneDay);
  if (couriers.length !== before) {
    console.log(`[Clean] Removed ${before - couriers.length} old couriers.`);
    saveCouriers();
  }
}
// Запускаем автоочистку каждые 10 минут
setInterval(removeOldCouriers, 10 * 60 * 1000);
*/

loadCouriers();

app.use(cors());
app.use(bodyParser.json()); // для req.body JSON
app.use(express.static('public'));

// 🔶API🔶 Регистрация нового курьера
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  // Проверка, существует ли пользователь
  if (couriers.find(user => user.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Проверка написания имейла
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidEmail) {
    return res.status(400).json({ message: 'Email is incorrect' });
  }

  // empty default values
  let name = `Courier ${randomUUID().slice(0, 6)}`; // ⚠️ crypto - генератор имен
  // let name = `Courier ${Math.floor(Math.random() * 9999)}`;
  // Проверка, существует ли уже такое имя
  // while (couriers.find(user => user.name === name)) {
  //   name = `Courier ${Math.floor(Math.random() * 9999)}`;
  // }
  let message = 'Thank you!';
  let bankLink = '';
  let updatedAt = Date.now();
  let avatarLink = '';

  // хэширование
  const { hash, salt } = hashPassword(password); // 🟪 hash+salt вместо password

  const newCourier = { username, email, /*password*/ hash, salt, name, message, bankLink, updatedAt, avatarLink };
  couriers.push(newCourier);
  saveCouriers();
  res.json({ success: true, username });
});

// 🔶API🔶 Заход в профиль
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = couriers.find(user => user.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Email is incorrect' });
  }
  const isValidPassword = verifyPassword(password, user.hash, user.salt); // 🟪
  if (!isValidPassword) {
    return res.status(401).json({ message: 'Password is incorrect' });
  }
  if (/*user.password === password*/isValidPassword) {
    const token = jwt.sign(user, secretKey, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Loading, please wait.', token });
  }
});

// 🔶API🔶 Форма обновления ссылки курьера
app.get('/api/edit', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен отсутствует' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secretKey);
    const courier = couriers.find(c => c.username === decoded.username);
    if (!courier) {
      return res.status(404).json({ error: 'Курьер не найден' });
    }
    res.json({ user: courier }); // отправляем данные на клиент
  } catch (err) {
    res.status(403).json({ error: 'Неверный токен' });
  }
});

// 🔶API🔶 Обновление ссылки курьера
// app.post('/api/update', (req, res) => {
//   const { username, email, password, name, message, bankLink } = req.body;
//   const courier = couriers.find(c => c.username === username);
//   if (!courier) {
//     return res.status(404).json({ error: 'Курьер не найден' });
//   }
//   courier.email = email;
//   courier.password = password;
//   courier.name = name;
//   courier.message = message;
//   courier.bankLink = bankLink;
//   courier.updatedAt = Date.now(); // число в миллисекундах
//   saveCouriers();
//   res.json({ success: true, username });
// });
app.post('/api/update', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Нет токена' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secretKey);
    const username = decoded.username; // username берем из токена!!!!!!

    const courier = couriers.find(user => user.username === decoded.username);
    if (!courier) {
      return res.status(404).json({ error: 'Курьер не найден' });
    }
    const { email, name, message, bankLink, avatarLink } = req.body;

    // Проверка, существует ли уже такое имя
    if (couriers.find(user => user.name === name) && courier.name !== name) {
      return res.status(400).json({ message: 'Name already exists' });
    }

    courier.email = email;
    courier.name = name;
    courier.message = message;
    courier.bankLink = bankLink;
    courier.updatedAt = Date.now();
    courier.avatarLink = avatarLink;
    saveCouriers();
    res.json({ success: true, username }); // username берем из токена!!!!!!
  } catch (err) {
    res.status(403).json({ error: 'Неверный токен' });
  }
});

// 🔶API🔶 Получить список активных курьеров
app.get('/api/couriers', (req, res) => {
  /*
  // только те, кто недавно обновили ссылку:
  // view current time: https://currentmillis.com/
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const active = couriers.filter(c => now - c.updatedAt < oneDay).map(({ username, name }) => ({ username, name }));
  res.json(active);
  */
  // только те курьеры, у кого есть ссылка bankLink:
  const valid = couriers.filter(c => c.bankLink !== '').map(({ username, name }) => ({ username, name }));
  res.json(valid);
});

// 🔶API🔶 Получить список всех аккаунтов
app.get('/api/listOfUsers', (req, res) => {
  const listOfUsers = couriers.map(({ username, email }) => ({ username, email }));
  res.json(listOfUsers);
});

// 🔶API🔶 Получить профиль курьера
app.get('/api/profile/:username', (req, res) => {
  const { username } = req.params;
  // const now = Date.now();
  // const oneDay = 24 * 60 * 60 * 1000;

  const courier = couriers.find(c => c.username === username/* && now - c.updatedAt < oneDay*/);

  if (!courier) {
    return res.status(404).json({ error: 'Courier not found or inactive' });
  }

  res.json({
    username: courier.username,
    name: courier.name,
    message: courier.message,
    bankLink: courier.bankLink,
    updatedAt: courier.updatedAt,
    avatarLink: courier.avatarLink
  });
});

// 🔶API🔶 geminiAI
app.get('/api/aigenerate', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });

    async function generate() {
      // Прямо приказываем модели создать JSON и следовать схеме.
      const prompt = "Generate a JSON object with a random 'firstName' and 'lastName'. Strictly adhere to the JSON schema and only return the JSON object, without any introductory text.";

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        generationConfig: {
          // Указываем, что ждем ответ в формате JSON
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              firstName: {
                type: "STRING",
                description: "The person's generated first name."
              },
              lastName: {
                type: "STRING",
                description: "The person's generated last name."
              }
            },
            required: ["firstName", "lastName"]
          },
        },
      });

      const rawText = response.text;
      // Находим первую открывающуюся фигурную скобку '{'
      const jsonStart = rawText.indexOf('{');
      // Находим последнюю закрывающуюся фигурную скобку '}'
      const jsonEnd = rawText.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        // Вырезаем подстроку, которая содержит только JSON
        const jsonString = rawText.substring(jsonStart, jsonEnd + 1);
        try {
          // Теперь парсим чистую JSON-строку
          const jsonResponse = JSON.parse(jsonString);
          return jsonResponse;
        } catch (e) {
           console.error("Ошибка парсинга JSON:", e);
           throw new Error("Не удалось разобрать JSON из ответа AI.");
        }
      } else {
        console.error("В ответе AI не найден валидный JSON:", rawText);
        throw new Error("В ответе AI не найден валидный JSON.");
      }
    }

    // Дожидаемся, пока Promise разрешится и вернет результат
    const randomName = await generate();
    console.log(randomName);
    res.json({ randomName });
  } catch (error) {
    console.error("Ошибка при генерации контента:", error);
    res.status(500).json({ error: "Не удалось сгенерировать имя" });
  }
});

/*
///////////////////////////////////////////////////////////////
// 🔶API🔶 OpenAI
app.get('/api/openaigenerate', async (req, res) => {
  try {
    const client = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
    });

    async function generate() {
      const response = await client.responses.create({
        model: 'gpt-4o',
        input: "Generate a JSON object with a random 'firstName' and 'lastName'. Strictly adhere to the JSON schema and only return the JSON object, without any introductory text.",
      });

      return response.output_text;
    }

    // Дожидаемся, пока Promise разрешится и вернет результат
    const randomName = await generate();
    console.log(randomName);
    res.json({ randomName });
  } catch (error) {
    console.error("Ошибка при генерации контента:", error);
    res.status(500).json({ error: "Не удалось сгенерировать имя" });
  }
});
*/

///////////////////////////////////////////////////////////////
// 🔶API🔶 from behindthename site
app.get('/api/generate', async (req, res) => {
  try {
    /*
    async function getRandomName() {
      const url = `https://www.behindthename.com/api/random.json?key=${apiKeyBehindthename}&randomsurname=yes&usage=eng`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        // console.log(data.names);
        return data.names;
      } catch (error) {
        console.error('Ошибка:', error);
      }
    }
  
    const randomName = await getRandomName();
    */

    const url = `https://www.behindthename.com/api/random.json?key=${apiKeyBehindthename}&randomsurname=yes&usage=eng`;
    const response = await fetch(url);
    const data = await response.json();
    const randomName = data.names;

    console.log(randomName);
    res.json({ randomName });
  } catch (error) {
    console.error("Ошибка при генерации контента:", error);
    res.status(500).json({ error: "Не удалось сгенерировать имя" });
  }
});
///////////////////////////////////////////////////////////////

// 🟢html🟢 отправляем index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🟢html🟢 отправляем edit.html
app.get('/edit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit.html'));
});

// 🟢html🟢 отправляем list.html ❌❌❌❌❌❌❌❌❌❌❌
// app.get('/list', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'list.html'));
// });

// 🟢html🟢 отправляем login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
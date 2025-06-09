const crypto = require('crypto');

// 🟪 Создание хэша пароля с солью
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// 🟪 Проверка пароля: ввод пользователя + сохранённые hash и salt
function verifyPassword(password, storedHash, storedSalt) {
  const hash = crypto.pbkdf2Sync(password, storedSalt, 100000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

module.exports = {
  hashPassword,
  verifyPassword,
};
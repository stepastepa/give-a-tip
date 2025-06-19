function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Проверяет JWT токен и перенаправляет:
 * - если токен валиден — на secureUrl (по умолчанию /edit)
 * - если просрочен или отсутствует — на fallbackUrl (по умолчанию /login)
 */
function secureRedirect(secureUrl/* = '/edit'*/, fallbackUrl/* = '/login'*/) {
  const token = localStorage.getItem('jwtToken');

  if (!token) {
    return window.location.href = fallbackUrl;
  }

  const decoded = parseJwt(token);

  if (!decoded || !decoded.exp) {
    localStorage.removeItem('jwtToken');
    return window.location.href = fallbackUrl;
  }

  const now = Date.now() / 1000;

  if (decoded.exp < now) {
    // alert('Сессия истекла. Пожалуйста, войдите снова.');
    localStorage.removeItem('jwtToken');
    return window.location.href = fallbackUrl;
  }

  // Всё в порядке — переход на защищённую страницу
  window.location.href = secureUrl;
}


////////////////////////////////////////
export { secureRedirect };
////////////////////////////////////////
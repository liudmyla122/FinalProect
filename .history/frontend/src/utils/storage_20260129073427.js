/**
 * Подготовка объекта user для сохранения в localStorage.
 * Не сохраняем аватар в base64 (фото/видео) — он может быть очень большим и вызывать QuotaExceededError.
 * Аватар подгружается с сервера при необходимости.
 */
export function getUserForLocalStorage(user) {
  if (!user || typeof user !== 'object') return user;
  const { avatar, ...rest } = user;
  const isLargeOrBase64 =
    typeof avatar === 'string' &&
    (avatar.startsWith('data:') || avatar.length > 2000);
  if (isLargeOrBase64) {
    return { ...rest, avatarType: user.avatarType || 'image' };
  }
  return { ...rest, avatar: avatar || '', avatarType: user.avatarType || 'image' };
}

/**
 * Безопасное сохранение user в localStorage (без большого аватара).
 */
export function setUserToLocalStorage(user) {
  try {
    const safe = getUserForLocalStorage(user);
    localStorage.setItem('user', JSON.stringify(safe));
  } catch (e) {
    console.warn('Не удалось сохранить user в localStorage:', e);
  }
}

const MAX_AVATAR_STORAGE = 100 * 1024; // 100 KB — не сохраняем большие base64 в localStorage

/**
 * Сохранение аватара в profile_avatar_${profileId} только если он небольшой (избегаем QuotaExceededError).
 */
export function setProfileAvatarSafe(profileId, avatar) {
  if (!profileId || typeof avatar !== 'string' || avatar.length > MAX_AVATAR_STORAGE) return;
  try {
    localStorage.setItem(`profile_avatar_${profileId}`, avatar);
  } catch (e) {
    console.warn('Не удалось сохранить аватар в отдельное хранилище:', e);
  }
}

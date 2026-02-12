export function getUserForLocalStorage(user) {
  if (!user || typeof user !== 'object') return user
  const { avatar, ...rest } = user
  const isLargeOrBase64 =
    typeof avatar === 'string' &&
    (avatar.startsWith('data:') || avatar.length > 2000)
  if (isLargeOrBase64) {
    return { ...rest, avatarType: user.avatarType || 'image' }
  }
  return {
    ...rest,
    avatar: avatar || '',
    avatarType: user.avatarType || 'image',
  }
}

export function setUserToLocalStorage(user) {
  try {
    const safe = getUserForLocalStorage(user)
    localStorage.setItem('user', JSON.stringify(safe))
  } catch (e) {
    console.warn('Не удалось сохранить user в localStorage:', e)
  }
}

const MAX_AVATAR_STORAGE = 2 * 1024 * 1024

export function setProfileAvatarSafe(profileId, avatar) {
  if (
    !profileId ||
    typeof avatar !== 'string' ||
    avatar.length > MAX_AVATAR_STORAGE
  )
    return
  try {
    localStorage.setItem(`profile_avatar_${profileId}`, avatar)
  } catch (e) {
    console.warn('Не удалось сохранить аватар в отдельное хранилище:', e)
  }
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { setUserToLocalStorage } from '../../utils/storage'
import AppSidebar from '../../components/AppSidebar/AppSidebar'
import '../../components/AppSidebar/AppSidebar.css'
import './EditProfile.css'

const EditProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isNewProfile = location.state?.mode === 'create'
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [about, setAbout] = useState('')
  const [organization, setOrganization] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarType, setAvatarType] = useState('image')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    document.title = isNewProfile
      ? 'Create new profile - ICHGRAM'
      : 'Edit profile - ICHGRAM'
    const stored = localStorage.getItem('user')
    const activeId = localStorage.getItem('activeProfileId')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        setUser(u)
        setUsername(u.username || '')
        setWebsite(u.website || '')
        setAbout(u.about || '')
        setOrganization(u.organization || '')
        let avatarToSet = u.avatar || u.profile_image || ''
        if (!avatarToSet && activeId) {
          try {
            avatarToSet =
              localStorage.getItem(`profile_avatar_${activeId}`) || ''
          } catch (_) {}
        }
        if (avatarToSet) {
          setAvatar(avatarToSet)
          setAvatarType(
            u.avatarType ||
              (avatarToSet.startsWith?.('data:video/') ? 'video' : 'image'),
          )
        }
      } catch {}
    }
    authAPI
      .getCurrentUser()
      .then((res) => {
        if (res?.user && res.user.organization !== undefined) {
          setOrganization((prev) => res.user.organization || prev || '')
        }
      })
      .catch(() => {})
  }, [isNewProfile])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setAvatarFile(file)
    const isVideo = file.type.startsWith('video/')
    setAvatarType(isVideo ? 'video' : 'image')

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (saving) return

    setSaving(true)
    setSaveError('')

    if (!username || !username.trim()) {
      setSaveError('Пожалуйста, введите username')
      setSaving(false)
      return
    }

    let finalAvatar =
      avatar || (user && (user.avatar || user.profile_image)) || ''
    let finalAvatarType = avatarType || (user && user.avatarType) || 'image'

    if (avatar && typeof avatar === 'string' && avatar.trim().length > 0) {
      try {
        console.log(
          '💾 Сохраняем аватар в базу данных при сохранении профиля:',
          {
            hasAvatar: !!avatar,
            avatarLength: avatar.length,
            avatarType: avatarType,
            avatarPreview: avatar.substring(0, 50),
            isVideo: avatar.startsWith('data:video/'),
          },
        )

        const avatarResponse = await authAPI.updateAvatar(avatar)

        console.log('📡 Ответ сервера updateAvatar при сохранении профиля:', {
          hasResponse: !!avatarResponse,
          hasUser: !!avatarResponse?.user,
          hasAvatar: !!avatarResponse?.user?.avatar,
          avatarType: avatarResponse?.user?.avatarType,
          avatarLength: avatarResponse?.user?.avatar?.length || 0,
        })

        if (
          avatarResponse &&
          avatarResponse.user &&
          avatarResponse.user.avatar
        ) {
          finalAvatar = avatarResponse.user.avatar
          finalAvatarType =
            avatarResponse.user.avatarType || avatarType || 'image'
          console.log(
            '✅ Аватар успешно сохранён в базу данных при сохранении профиля:',
            {
              avatarType: finalAvatarType,
              isVideo: finalAvatarType === 'video',
            },
          )
        } else {
          console.warn(
            '⚠️ Сервер не вернул аватар в ответе, используем локальный',
          )
        }
      } catch (avatarError) {
        console.error(
          '❌ Ошибка при сохранении аватара в базу данных:',
          avatarError,
        )

        console.warn(
          'Продолжаем с локальным аватаром, но он может не сохраниться на сервере',
        )
      }
    } else {
      console.log('ℹ️ Аватар не загружен, пропускаем сохранение в базу данных')
    }

    const updated = {
      ...(user || {}),
      username: username.trim(),
      website: website.trim(),
      about: about.trim(),
      avatar: finalAvatar,
      avatarType: finalAvatarType,
      profileCompleted: true,
    }

    try {
      let profilesRaw
      try {
        profilesRaw = localStorage.getItem('profiles')
      } catch (localError) {
        console.error('Ошибка при чтении из localStorage:', localError)
        setSaveError(
          'Ошибка доступа к локальному хранилищу. Проверьте настройки браузера.',
        )
        setSaving(false)
        return
      }

      let list = []
      if (profilesRaw) {
        try {
          list = JSON.parse(profilesRaw) || []
          if (!Array.isArray(list)) {
            list = []
          }
        } catch (parseError) {
          console.error('Ошибка при парсинге profiles:', parseError)
          list = []
        }
      }

      let activeId = updated.id || localStorage.getItem('activeProfileId')
      if (!activeId) {
        activeId = `profile-${Date.now()}`
      }

      const avatarData = updated.avatar
      const profileWithoutAvatar = {
        ...updated,
        avatar: '',
        id: activeId,
      }

      if (avatarData) {
        try {
          localStorage.setItem(`profile_avatar_${activeId}`, avatarData)
        } catch (avatarError) {
          console.warn('Не удалось сохранить аватар отдельно:', avatarError)
        }
      }

      const exists = list.some((p) => p.id === activeId)
      const newList = exists
        ? list.map((p) => (p.id === activeId ? profileWithoutAvatar : p))
        : [...list, profileWithoutAvatar]

      try {
        const profilesString = JSON.stringify(newList)
        const profilesSizeKB = new Blob([profilesString]).size / 1024

        if (profilesSizeKB > 4000) {
          console.warn(
            `⚠️ Размер данных профилей большой: ${profilesSizeKB.toFixed(2)} KB`,
          )
        }

        localStorage.setItem('profiles', profilesString)
        localStorage.setItem('activeProfileId', activeId)

        const userWithAvatar = { ...profileWithoutAvatar, avatar: avatarData }
        setUserToLocalStorage(userWithAvatar)

        console.log('✅ Профиль успешно сохранён в localStorage:', {
          username: profileWithoutAvatar.username,
          id: activeId,
          profilesCount: newList.length,
          profilesSizeKB: profilesSizeKB.toFixed(2),
        })
      } catch (localError) {
        console.error('❌ Ошибка при сохранении в localStorage:', localError)

        if (localError.name === 'QuotaExceededError') {
          try {
            const keysToRemove = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && key.startsWith('profile_avatar_')) {
                keysToRemove.push(key)
              }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key))
            console.log(`Очищено ${keysToRemove.length} старых аватаров`)

            const profilesWithoutAvatars = newList.map((p) => ({
              ...p,
              avatar: '',
            }))
            localStorage.setItem(
              'profiles',
              JSON.stringify(profilesWithoutAvatars),
            )
            localStorage.setItem('activeProfileId', activeId)
            setUserToLocalStorage({
              ...profileWithoutAvatar,
              avatar: avatarData,
            })

            console.log('✅ Профиль сохранён после очистки старых данных')
          } catch (retryError) {
            console.error(
              '❌ Критическая ошибка даже после очистки:',
              retryError,
            )
            setSaveError(
              'Недостаточно места в браузере. Очистите данные сайта или используйте другой браузер.',
            )
            setSaving(false)
            return
          }
        } else {
          setSaveError(
            'Ошибка при сохранении профиля. Проверьте консоль браузера.',
          )
          setSaving(false)
          return
        }
      }

      let serverError = false
      let serverErrorMessage = ''
      try {
        let serverProfiles = []
        try {
          const currentUserRes = await authAPI.getCurrentUser()
          serverProfiles = currentUserRes?.user?.profiles || []
        } catch (_) {}

        const profilesForServer = newList.map((p) => {
          const fromServer = serverProfiles.find(
            (s) => s && String(s.id) === String(p.id),
          )
          const avatar =
            p.id === activeId
              ? avatarData || ''
              : (fromServer?.avatar ?? p.avatar ?? '')

          // Fix: Explicitly send avatarType to server
          const type =
            p.id === activeId
              ? updated.avatarType ||
                (avatar.startsWith('data:video/') ? 'video' : 'image')
              : (fromServer?.avatarType ?? p.avatarType ?? 'image')

          return { ...p, avatar, avatarType: type }
        })

        const response = await authAPI.updateProfiles(
          profilesForServer,
          organization.trim(),
        )
        if (response && response.success !== false) {
          console.log('✅ Профиль успешно сохранён на сервере')
        } else {
          serverError = true
          serverErrorMessage = response?.message || 'Неизвестная ошибка сервера'
          console.warn('⚠️ Сервер вернул ошибку:', response)
        }
      } catch (err) {
        console.error('❌ Ошибка при сохранении профилей на сервере:', err)
        serverError = true
        serverErrorMessage =
          err.response?.data?.message || err.message || 'Ошибка сети'
      }

      const savedProfiles = localStorage.getItem('profiles')
      const savedUser = localStorage.getItem('user')
      const savedActiveId = localStorage.getItem('activeProfileId')

      if (!savedProfiles || !savedUser || !savedActiveId) {
        console.error(
          '❌ Критическая ошибка: данные не сохранились в localStorage',
        )
        setSaveError(
          'Критическая ошибка: данные не сохранились. Попробуйте ещё раз.',
        )
        setSaving(false)
        return
      }

      try {
        const parsedUser = JSON.parse(savedUser)
        if (!parsedUser.profileCompleted) {
          console.warn(
            '⚠️ Профиль сохранён, но profileCompleted не установлен. Исправляем...',
          )
          parsedUser.profileCompleted = true
          setUserToLocalStorage(parsedUser)

          const parsedProfiles = JSON.parse(savedProfiles)
          const updatedProfiles = parsedProfiles.map((p) =>
            p.id === savedActiveId ? { ...p, profileCompleted: true } : p,
          )
          localStorage.setItem('profiles', JSON.stringify(updatedProfiles))
        }
      } catch (parseError) {
        console.error('Ошибка при проверке сохранённых данных:', parseError)
      }

      setSaving(false)
      console.log('✅ Профиль сохранён. Переход на страницу профиля...')

      window.location.href = '/profile'
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error)
      const errorMessage = error?.message || 'Неизвестная ошибка'
      setSaveError(
        `Ошибка при сохранении профиля: ${errorMessage}. Проверьте консоль браузера для деталей.`,
      )
      setSaving(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (
      !window.confirm(
        'Удалить этот профиль? Его данные и публикации в этом профиле больше не будут отображаться.',
      )
    ) {
      return
    }

    try {
      const profilesRaw = localStorage.getItem('profiles')
      let list = []
      if (profilesRaw) {
        try {
          list = JSON.parse(profilesRaw) || []
        } catch {
          list = []
        }
      }

      const activeId = localStorage.getItem('activeProfileId')
      const filtered = activeId ? list.filter((p) => p.id !== activeId) : list

      if (filtered.length > 0) {
        const newActive = filtered[0]
        localStorage.setItem('profiles', JSON.stringify(filtered))
        localStorage.setItem('activeProfileId', newActive.id)
        setUserToLocalStorage(newActive)
        try {
          await authAPI.updateProfiles(filtered)
        } catch (err) {
          console.error('Ошибка при сохранении профилей на сервере:', err)
        }
        navigate('/profile')
      } else {
        localStorage.setItem('profiles', JSON.stringify([]))
        localStorage.removeItem('activeProfileId')
        try {
          await authAPI.updateProfiles([])
        } catch (err) {
          console.error('Ошибка при сохранении профилей на сервере:', err)
        }
        navigate('/profile/edit')
      }
    } catch (error) {
      console.error('Ошибка при удалении профиля:', error)
    }
  }

  return (
    <div className="app-layout-with-sidebar edit-profile-page">
      <AppSidebar activeItem="profile" />
      <div className="app-layout-main">
        <main className="edit-profile-main">
          <header className="edit-profile-header">
            <h1>{isNewProfile ? 'Create new profile' : 'Edit profile'}</h1>
          </header>

          <section className="edit-profile-content">
            <div className="edit-profile-card">
              <div className="edit-profile-avatar-row">
                <div className="edit-profile-avatar-circle">
                  {avatar ? (
                    avatarType === 'video' ? (
                      <video
                        src={avatar}
                        className="edit-profile-avatar-video"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={avatar}
                        alt="Profile"
                        className="edit-profile-avatar-image"
                      />
                    )
                  ) : (
                    <span className="edit-profile-avatar-text">
                      {(user?.username || 'IC').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="edit-profile-name-block">
                  <div className="edit-profile-name">
                    {user?.username || 'your_username'}
                  </div>
                  <div className="edit-profile-subtitle">
                    •{' '}
                    {isNewProfile
                      ? 'Заполните данные нового профиля'
                      : 'Заполните информацию профиля ICHgram'}
                  </div>
                </div>
                <button
                  type="button"
                  className="edit-profile-newphoto-btn"
                  onClick={() => {
                    const input = document.getElementById(
                      'edit-profile-avatar-upload',
                    )
                    if (input) input.click()
                  }}
                >
                  New photo
                </button>
                <input
                  id="edit-profile-avatar-upload"
                  type="file"
                  accept="image/*,video/mp4"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>

              <form className="edit-profile-form" onSubmit={handleSave}>
                <label className="edit-profile-field">
                  <span className="edit-profile-label">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="edit-profile-input"
                    required
                  />
                </label>

                <label className="edit-profile-field">
                  <span className="edit-profile-label">Website</span>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="edit-profile-input"
                    placeholder="https://"
                  />
                </label>

                <label className="edit-profile-field">
                  <span className="edit-profile-label">About</span>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="edit-profile-textarea"
                    maxLength={1500}
                    rows={10}
                  />
                  <div className="edit-profile-counter">
                    {about.length} / 1500
                  </div>
                </label>

                <label className="edit-profile-field">
                  <span className="edit-profile-label">
                    Organization / company name
                  </span>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="edit-profile-input"
                    placeholder="Where you work"
                    maxLength={200}
                  />
                  <div className="edit-profile-counter">
                    {organization.length} / 200
                  </div>
                </label>

                {saveError && (
                  <div
                    className="edit-profile-error"
                    style={{
                      color: '#ed4956',
                      marginTop: '8px',
                      fontSize: '14px',
                    }}
                  >
                    {saveError}
                  </div>
                )}
                <div className="edit-profile-actions">
                  <button
                    type="submit"
                    className="edit-profile-save-btn"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="edit-profile-delete-btn"
                    onClick={handleDeleteProfile}
                    disabled={saving}
                  >
                    Delete profile
                  </button>
                </div>
              </form>
            </div>
          </section>

          <footer className="profile-footer">
            <nav className="footer-nav">
              <Link to="/">Home</Link>
              <Link to="/search">Search</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/notifications">Notifications</Link>
              <Link to="/create">Create</Link>
            </nav>
            <div className="footer-copyright">© 2026 ICHgram</div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default EditProfile

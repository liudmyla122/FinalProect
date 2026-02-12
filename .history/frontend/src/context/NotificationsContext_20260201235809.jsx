import { createContext, useContext, useState } from 'react'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const openNotifications = () => setIsOpen(true)
  const closeNotifications = () => setIsOpen(false)
  const toggleNotifications = () => setIsOpen(prev => !prev)

  return (
    <NotificationsContext.Provider value={{ isOpen, openNotifications, closeNotifications, toggleNotifications }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    return { 
      isOpen: false, 
      openNotifications: () => {}, 
      closeNotifications: () => {},
      toggleNotifications: () => {}
    }
  }
  return ctx
}

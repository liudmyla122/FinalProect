import { createContext, useContext, useState, useCallback } from 'react'

const MobileMenuContext = createContext()

export function MobileMenuProvider({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const openMobileMenu = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen((prev) => !prev)
  }, [])

  return (
    <MobileMenuContext.Provider
      value={{
        isMobileOpen,
        openMobileMenu,
        closeMobileMenu,
        toggleMobileMenu,
      }}
    >
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext)
  if (!context) {
    throw new Error('useMobileMenu must be used within a MobileMenuProvider')
  }
  return context
}

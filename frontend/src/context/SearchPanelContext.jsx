import { createContext, useContext, useState } from 'react'

const SearchPanelContext = createContext(null)

export function SearchPanelProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const openSearch = () => setIsOpen(true)
  const closeSearch = () => setIsOpen(false)
  return (
    <SearchPanelContext.Provider value={{ isOpen, openSearch, closeSearch }}>
      {children}
    </SearchPanelContext.Provider>
  )
}

export function useSearchPanel() {
  const ctx = useContext(SearchPanelContext)
  if (!ctx) {
    return { isOpen: false, openSearch: () => {}, closeSearch: () => {} }
  }
  return ctx
}

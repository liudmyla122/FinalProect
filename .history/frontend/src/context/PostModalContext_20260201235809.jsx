import { createContext, useContext, useState } from 'react'

const PostModalContext = createContext()

export const PostModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [postId, setPostId] = useState(null)
  const [initialData, setInitialData] = useState(null)

  const openPostModal = (id, data = null) => {
    setPostId(id)
    setInitialData(data)
    setIsOpen(true)
  }

  const closePostModal = () => {
    setIsOpen(false)
    setPostId(null)
    setInitialData(null)
  }

  return (
    <PostModalContext.Provider value={{ isOpen, postId, initialData, openPostModal, closePostModal }}>
      {children}
    </PostModalContext.Provider>
  )
}

export const usePostModal = () => useContext(PostModalContext)

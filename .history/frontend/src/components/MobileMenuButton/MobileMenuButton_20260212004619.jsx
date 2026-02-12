import { useMobileMenu } from '../../context/MobileMenuContext'
import './MobileMenuButton.css'

function MobileMenuButton() {
  const { openMobileMenu } = useMobileMenu()

  return (
    <button
      className="mobile-menu-button"
      onClick={openMobileMenu}
      aria-label="Open menu"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  )
}

export default MobileMenuButton

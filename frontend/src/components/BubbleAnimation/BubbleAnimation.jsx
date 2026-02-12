import { useEffect, useState } from 'react'
import './BubbleAnimation.css'

const BubbleAnimation = ({ avatars = [] }) => {
  const [bubbles, setBubbles] = useState([])

  useEffect(() => {
    const createBubbles = () => {
      const bubbleCount = 8
      const newBubbles = []

      const avatarList =
        avatars.length > 0
          ? avatars.map((avatar) =>
              typeof avatar === 'string' ? avatar : avatar.avatar || ''
            )
          : Array.from(
              { length: bubbleCount },
              (_, i) => `https://i.pravatar.cc/150?img=${i + 1}`
            )

      for (let i = 0; i < bubbleCount; i++) {
        const avatar =
          avatarList[i % avatarList.length] ||
          `https://i.pravatar.cc/150?img=${i + 1}`
        newBubbles.push({
          id: i,
          avatar: avatar,
          left: Math.random() * 100,
          delay: Math.random() * 5,
          duration: 15 + Math.random() * 10,
          size: 40 + Math.random() * 30,
        })
      }

      setBubbles(newBubbles)
    }

    createBubbles()
  }, [avatars])

  return (
    <div className="bubble-animation-container">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.left}%`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
          }}
        >
          <div className="bubble-inner">
            <img
              src={
                bubble.avatar ||
                `https://i.pravatar.cc/150?img=${bubble.id + 1}`
              }
              alt="Avatar"
              className="bubble-avatar"
              onError={(e) => {
                e.target.src = `https://i.pravatar.cc/150?img=${bubble.id + 1}`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default BubbleAnimation

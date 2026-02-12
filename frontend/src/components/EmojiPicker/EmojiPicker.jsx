import { useState, useRef, useEffect } from 'react';
import './EmojiPicker.css';

const EMOJI_LIST = [
  '😀', '😊', '😍', '🥰', '😘', '😂', '🤣', '😅', '😇', '🙂',
  '👍', '❤️', '💕', '🔥', '✨', '⭐', '🎉', '🎊', '💯', '🙌',
  '😢', '😭', '😡', '🤔', '😎', '🥳', '😴', '🤗', '👏', '💪',
];

const EmojiPicker = ({ onSelect, disabled, className = '' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={`emoji-picker-wrap ${className}`} ref={containerRef}>
      <button
        type="button"
        className="emoji-picker-btn"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="Emoji"
        title="Emoji"
      >
        😀
      </button>
      {open && (
        <div className="emoji-picker-panel">
          {EMOJI_LIST.map((emoji, i) => (
            <button
              key={i}
              type="button"
              className="emoji-picker-item"
              onClick={() => {
                onSelect(emoji);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;

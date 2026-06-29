'use client';

import { useEffect, useRef } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = [
  0x1f600, 0x1f601, 0x1f602, 0x1f923,
  0x1f60a, 0x1f60d, 0x2764, 0x1f44d,
  0x1f44e, 0x1f62d, 0x1f60e, 0x1f525,
  0x1f389, 0x1f622, 0x1f970, 0x1f4af,
].map((codePoint) => String.fromCodePoint(codePoint));

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-3 right-3 z-10 mb-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg sm:left-0 sm:right-auto sm:w-auto"
    >
      <div className="grid grid-cols-4 gap-2">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="flex h-10 w-10 items-center justify-center rounded transition-colors hover:bg-gray-100"
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

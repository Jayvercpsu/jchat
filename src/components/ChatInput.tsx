'use client';

import { useState, useRef, KeyboardEvent, RefObject } from 'react';

interface ChatInputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onSend: (text: string) => void;
  onEmojiClick: () => void;
}

export default function ChatInput({ inputRef, onSend, onEmojiClick }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 border-t border-gray-200 bg-white">
      <button
        onClick={onEmojiClick}
        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        type="button"
      >
        <span className="text-xl">😊</span>
      </button>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:border-gray-300 focus:outline-none text-sm"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}
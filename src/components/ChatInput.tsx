'use client';

import { useState, KeyboardEvent, RefObject } from 'react';

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
    <div className="flex items-center gap-2 border-t border-gray-200 bg-white p-2 sm:p-3">
      <button
        onClick={onEmojiClick}
        className="shrink-0 rounded-full p-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        type="button"
        aria-label="Open emoji picker"
      >
        :)
      </button>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="min-w-0 flex-1 rounded-full border border-transparent bg-gray-100 px-4 py-2 text-sm focus:border-gray-300 focus:bg-white focus:outline-none"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="shrink-0 rounded-full bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 sm:px-4"
        aria-label="Send message"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

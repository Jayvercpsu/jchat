'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, User } from '@/lib/types';
import { getMessages, sendMessage, toggleMessageLike, getUserById } from '@/lib/api';
import { getInitials, getAvatarColor } from '@/lib/utils';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EmojiPicker from './EmojiPicker';

interface ChatWindowProps {
  currentUserId: string;
  friendId: string;
  onBack?: () => void;
}

export default function ChatWindow({ currentUserId, friendId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [friend, setFriend] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');

      try {
        const [friendResult, messagesResult] = await Promise.all([
          getUserById(friendId),
          getMessages(currentUserId, friendId),
        ]);

        if (!friendResult.success || !friendResult.data) {
          setError(friendResult.error || 'Failed to load user');
          setLoading(false);
          return;
        }

        if (!messagesResult.success || !messagesResult.data) {
          setError(messagesResult.error || 'Failed to load messages');
          setLoading(false);
          return;
        }

        setFriend(friendResult.data);
        setMessages(messagesResult.data);
      } catch {
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUserId, friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    setError('');

    try {
      const result = await sendMessage(currentUserId, friendId, text);
      const newMessage = result.data;
      if (!result.success || !newMessage) {
        setError(result.error || 'Failed to send message');
        return;
      }

      setMessages((previous) => [...previous, newMessage]);
    } catch {
      setError('Failed to send message');
    }
  };

  const handleLike = async (messageId: string) => {
    try {
      const result = await toggleMessageLike(messageId);
      if (result.success && result.data) {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === messageId ? { ...message, liked: result.data!.liked } : message
          )
        );
      }
    } catch {
      console.error('Failed to like message');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const newValue = input.value.substring(0, start) + emoji + input.value.substring(start);
      input.value = newValue;
      input.focus();

      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + emoji.length;
      }, 0);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Loading messages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-red-500">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="mx-auto mt-2 block text-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex min-h-14 items-center gap-3 border-b border-gray-200 bg-white px-3 sm:px-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 md:hidden"
            aria-label="Go back"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        {friend && (
          <>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: getAvatarColor(friend.displayName) }}
            >
              {getInitials(friend.displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{friend.displayName}</p>
              <p className="truncate text-xs text-gray-500">{friend.email}</p>
            </div>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>Start a conversation!</p>
            <p className="text-sm">Send a message below</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              text={message.text}
              isOwn={message.senderId === currentUserId}
              liked={message.liked}
              createdAt={message.createdAt}
              onLike={() => handleLike(message.id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative shrink-0">
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
        <ChatInput
          inputRef={inputRef}
          onSend={handleSend}
          onEmojiClick={() => setShowEmojiPicker((previous) => !previous)}
        />
      </div>
    </div>
  );
}

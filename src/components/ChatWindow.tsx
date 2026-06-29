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

  // Fetch messages and friend info
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');

      try {
        // Get friend info
        const friendResult = await getUserById(friendId);
        if (friendResult.success && friendResult.data) {
          setFriend(friendResult.data);
        }

        // Get messages
        const messagesResult = await getMessages(currentUserId, friendId);
        if (messagesResult.success && messagesResult.data) {
          setMessages(messagesResult.data);
        }
      } catch {
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUserId, friendId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    try {
      const result = await sendMessage(currentUserId, friendId, text);
      if (result.success && result.data) {
        setMessages(prev => [...prev, result.data!]);
      }
    } catch {
      setError('Failed to send message');
    }
  };

  const handleLike = async (messageId: string) => {
    try {
      const result = await toggleMessageLike(messageId);
      if (result.success && result.data) {
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, liked: result.data!.liked } : m))
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
      const newValue =
        input.value.substring(0, start) + emoji + input.value.substring(start);
      input.value = newValue;
      input.focus();
      // Move cursor after emoji
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + emoji.length;
      }, 0);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          Loading messages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-500">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mt-2 text-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Chat Header */}
      <div className="flex min-h-14 items-center gap-3 border-b border-gray-200 bg-white px-3 sm:px-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 md:hidden"
          >
            Back
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

      {/* Messages */}
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

      {/* Input */}
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
          onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
        />
      </div>
    </div>
  );
}

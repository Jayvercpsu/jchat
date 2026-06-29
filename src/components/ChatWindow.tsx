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
}

export default function ChatWindow({ currentUserId, friendId }: ChatWindowProps) {
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
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-gray-200 bg-white">
        {friend && (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
              style={{ backgroundColor: getAvatarColor(friend.displayName) }}
            >
              {getInitials(friend.displayName)}
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">{friend.displayName}</p>
              <p className="text-xs text-gray-500">{friend.email}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
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
      <div className="relative">
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
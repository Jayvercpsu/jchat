'use client';

import { User } from '@/lib/types';
import { getInitials, getAvatarColor, formatTime } from '@/lib/utils';

interface FriendCardProps {
  user: User;
  isSelected: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  onClick: () => void;
}

export default function FriendCard({
  user,
  isSelected,
  lastMessage,
  lastMessageTime,
  onClick,
}: FriendCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
        style={{ backgroundColor: getAvatarColor(user.displayName) }}
      >
        {getInitials(user.displayName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{user.displayName}</p>
        {lastMessage && (
          <p className="text-xs text-gray-500 truncate">{lastMessage}</p>
        )}
      </div>
      {lastMessageTime && (
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatTime(lastMessageTime)}
        </span>
      )}
    </button>
  );
}
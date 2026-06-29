'use client';

import { User } from '@/lib/types';
import { getInitials, getAvatarColor, formatTime } from '@/lib/utils';

interface FriendCardProps {
  user: User;
  isSelected: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  onClick: () => void;
}

export default function FriendCard({
  user,
  isSelected,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  onClick,
}: FriendCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: getAvatarColor(user.displayName) }}
      >
        {getInitials(user.displayName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{user.displayName}</p>
        {lastMessage && (
          <p
            className={`truncate text-xs ${
              unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'
            }`}
          >
            {lastMessage}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {lastMessageTime && (
          <span className="hidden text-xs text-gray-400 sm:block">
            {formatTime(lastMessageTime)}
          </span>
        )}
        {unreadCount > 0 && (
          <span className="flex min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}

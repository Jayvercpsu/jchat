'use client';

import { User } from '@/lib/types';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface UserCardProps {
  user: User;
  currentUserId: string;
  onAddFriend: (friendId: string) => void;
  isFriend: boolean;
}

export default function UserCard({
  user,
  currentUserId,
  onAddFriend,
  isFriend,
}: UserCardProps) {
  // Don't show current user
  if (user.id === currentUserId) return null;

  // Don't show if already a friend
  if (isFriend) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: getAvatarColor(user.displayName) }}
        >
          {getInitials(user.displayName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800">{user.displayName}</p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      <button
        onClick={() => onAddFriend(user.id)}
        disabled={isFriend}
        className="w-full rounded-full bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
      >
        {isFriend ? 'Added' : 'Add Friend'}
      </button>
    </div>
  );
}

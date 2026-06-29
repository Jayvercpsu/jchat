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
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: getAvatarColor(user.displayName) }}
        >
          {getInitials(user.displayName)}
        </div>
        <div>
          <p className="font-medium text-gray-800 text-sm">{user.displayName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      <button
        onClick={() => onAddFriend(user.id)}
        disabled={isFriend}
        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isFriend ? 'Added' : 'Add Friend'}
      </button>
    </div>
  );
}
'use client';

import { User } from '@/lib/types';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface FriendRequestCardProps {
  user: User;
  onAccept: () => void;
  onDecline: () => void;
  loading?: boolean;
}

export default function FriendRequestCard({
  user,
  onAccept,
  onDecline,
  loading = false,
}: FriendRequestCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-3">
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

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onAccept}
          disabled={loading}
          className="flex-1 rounded-full bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={loading}
          className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

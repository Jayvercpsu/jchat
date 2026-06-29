'use client';

import { useState } from 'react';
import { MessageNotification } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface NotificationBellProps {
  notifications: MessageNotification[];
  markingRead: boolean;
  error?: string;
  onMarkAllRead: () => Promise<void> | void;
  onOpenChat: (friendId: string) => void;
}

export default function NotificationBell({
  notifications,
  markingRead,
  error,
  onMarkAllRead,
  onOpenChat,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.reduce(
    (total, notification) => total + notification.unreadCount,
    0
  );

  const handleMarkAllRead = async () => {
    await onMarkAllRead();
  };

  const handleOpenChat = (friendId: string) => {
    setOpen(false);
    onOpenChat(friendId);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
        aria-label="Notifications"
        title="Notifications"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17a3 3 0 006 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Notifications</p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? 'Incoming messages' : 'Wala ray incoming message'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {markingRead ? 'Saving...' : 'Mark as read'}
              </button>
            )}
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="px-4 py-5 text-center text-sm text-gray-500">
              No unread messages right now.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {notifications.map((notification) => (
                <button
                  key={notification.sender.id}
                  type="button"
                  onClick={() => handleOpenChat(notification.sender.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="mt-1 flex min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {notification.unreadCount > 9 ? '9+' : notification.unreadCount}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-800">
                      {notification.sender.displayName}
                    </span>
                    <span className="block truncate text-xs text-gray-600">
                      {notification.latestMessage.text}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatTime(notification.latestMessage.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { formatDateTime } from '@/lib/utils';

interface MessageBubbleProps {
  text: string;
  isOwn: boolean;
  liked: boolean;
  createdAt: string;
  onLike: () => void;
}

export default function MessageBubble({
  text,
  isOwn,
  liked,
  createdAt,
  onLike,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        <p className="text-sm break-words">{text}</p>
        <div
          className={`flex items-center justify-end gap-2 mt-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          <span className="text-xs">{formatDateTime(createdAt)}</span>
          <button
            onClick={onLike}
            className={`text-sm opacity-0 group-hover:opacity-100 transition-opacity ${
              liked ? 'opacity-100 text-red-500' : ''
            }`}
          >
            {liked ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}
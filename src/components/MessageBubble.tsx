'use client';

import { formatDateTime } from '@/lib/utils';

interface MessageBubbleProps {
  text: string;
  isOwn: boolean;
  liked: boolean;
  createdAt: string;
  onLike: () => void;
}

const HEART = String.fromCodePoint(0x2764, 0xfe0f);
const LIKE = String.fromCodePoint(0x1f917);

export default function MessageBubble({
  text,
  isOwn,
  liked,
  createdAt,
  onLike,
}: MessageBubbleProps) {
  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[75%] ${
          isOwn
            ? 'rounded-br-md bg-blue-500 text-white'
            : 'rounded-bl-md bg-gray-100 text-gray-800'
        }`}
      >
        <p className="break-words text-sm">{text}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-2 ${
            isOwn ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          <span className="text-xs">{formatDateTime(createdAt)}</span>
          <button
            onClick={onLike}
            className={`text-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 ${
              liked ? 'opacity-100 text-red-500' : ''
            }`}
            type="button"
            aria-label={liked ? 'Unlike message' : 'Like message'}
          >
            {liked ? HEART : LIKE}
          </button>
        </div>
      </div>
    </div>
  );
}

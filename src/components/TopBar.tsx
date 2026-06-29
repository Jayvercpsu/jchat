'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearSession } from '@/lib/api';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface TopBarProps {
  userName: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function TopBar({ userName, searchQuery, onSearchChange }: TopBarProps) {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Left: App Name / Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: getAvatarColor(userName) }}
          >
            {getInitials(userName)}
          </div>
          <span className="text-xl font-bold text-gray-800">JChat</span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className={`flex-1 max-w-md mx-4 ${showSearch ? '' : 'hidden md:block'}`}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full px-4 py-2 pl-10 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:border-gray-300 focus:outline-none text-sm"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Right: Mobile Search Toggle & Logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
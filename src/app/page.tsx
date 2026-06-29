'use client';

import { useEffect, useState } from 'react';
import { getSession, clearSession } from '@/lib/api';
import { Session } from '@/lib/types';
import FriendList from '@/components/FriendList';
import UserList from '@/components/UserList';
import ChatWindow from '@/components/ChatWindow';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'users'>('friends');
  const [loading, setLoading] = useState(true);
  const showMobileChat = selectedFriendId !== null;

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      window.location.replace('/login');
      return;
    }

    setSession(currentSession);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    clearSession();
    window.location.replace('/login');
  };

  if (loading || !session) {
    return <LoadingFallback />;
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-4 sm:py-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="truncate text-xl font-bold text-gray-800">JChat</span>
          </div>

          <div
            className={`order-3 w-full sm:order-none sm:flex-1 sm:max-w-md ${
              showMobileChat ? 'hidden sm:block' : ''
            }`}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-full border border-transparent bg-gray-100 px-4 py-2 text-sm focus:border-gray-300 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
            aria-label="Logout"
            title="Logout"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H9"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 20H6a2 2 0 01-2-2V6a2 2 0 012-2h7"
              />
            </svg>
          </button>
        </div>
      </header>

      {!showMobileChat && (
        <div className="flex border-b border-gray-200 md:hidden">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'friends'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500'
            }`}
          >
            Users
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`${
            showMobileChat ? 'hidden' : 'flex'
          } w-full flex-col overflow-hidden bg-gray-50 md:flex md:w-80 md:min-w-[20rem] md:border-r md:border-gray-200`}
        >
          <div className="hidden border-b border-gray-200 p-2 md:flex">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 rounded py-2 text-sm font-medium ${
                activeTab === 'friends'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 rounded py-2 text-sm font-medium ${
                activeTab === 'users'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Users
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {activeTab === 'friends' ? (
              <FriendList
                currentUserId={session.userId}
                selectedFriendId={selectedFriendId}
                onSelectFriend={setSelectedFriendId}
                searchQuery={searchQuery}
              />
            ) : (
              <UserList currentUserId={session.userId} searchQuery={searchQuery} />
            )}
          </div>
        </aside>

        <main
          className={`${
            showMobileChat ? 'flex' : 'hidden'
          } min-w-0 flex-1 flex-col bg-white md:flex`}
        >
          {selectedFriendId ? (
            <ChatWindow
              currentUserId={session.userId}
              friendId={selectedFriendId}
              onBack={() => setSelectedFriendId(null)}
            />
          ) : (
            <div className="hidden flex-1 items-center justify-center px-6 text-gray-500 md:flex">
              <div className="text-center">
                <p className="text-lg">Welcome to JChat!</p>
                <p className="mt-2 text-sm">Select an accepted friend to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

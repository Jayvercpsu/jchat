'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/api';
import { Session } from '@/lib/types';
import FriendList from '@/components/FriendList';
import UserList from '@/components/UserList';
import ChatWindow from '@/components/ChatWindow';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// Main home content
function HomeContent() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'users'>('friends');
  const [loading, setLoading] = useState(true);
  const showMobileChat = selectedFriendId !== null;

  // Check session on mount
  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.push('/login');
    } else {
      setSession(currentSession);
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  if (loading || !session) {
    return <LoadingFallback />;
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* TopBar with search override */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-4 sm:py-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="truncate text-xl font-bold text-gray-800">JChat</span>
          </div>

          <div className="order-3 w-full sm:order-none sm:flex-1 sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-full border border-transparent bg-gray-100 px-4 py-2 text-sm focus:border-gray-300 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            onClick={handleLogout}
            className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
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

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar - Friends / Users */}
        <aside
          className={`${
            showMobileChat ? 'hidden' : 'flex'
          } w-full flex-col overflow-hidden bg-gray-50 md:flex md:w-80 md:min-w-80 md:border-r md:border-gray-200`}
        >
          {/* Desktop Header */}
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

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {activeTab === 'friends' ? (
              <FriendList
                currentUserId={session.userId}
                selectedFriendId={selectedFriendId}
                onSelectFriend={setSelectedFriendId}
                searchQuery={searchQuery}
              />
            ) : (
              <UserList
                currentUserId={session.userId}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </aside>

        {/* Right Side - Chat */}
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
                <p className="mt-2 text-sm">Select a friend to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Main page with Suspense
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}

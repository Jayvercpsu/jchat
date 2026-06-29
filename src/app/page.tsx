'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/api';
import { Session } from '@/lib/types';
import TopBar from '@/components/TopBar';
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
    <div className="h-screen flex flex-col bg-white">
      {/* TopBar with search override */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-800">JChat</span>
        </div>

        <div className="flex-1 max-w-md mx-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:border-gray-300 focus:outline-none text-sm"
          />
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Logout
        </button>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'friends'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'users'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
        >
          Users
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Friends / Users */}
        <aside className="w-80 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden md:flex p-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 text-sm font-medium rounded ${
                activeTab === 'friends'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 text-sm font-medium rounded ${
                activeTab === 'users'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Users
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2">
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
        <main className="flex-1 flex flex-col bg-white">
          {selectedFriendId ? (
            <ChatWindow
              currentUserId={session.userId}
              friendId={selectedFriendId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg">Welcome to JChat!</p>
                <p className="text-sm mt-2">Select a friend to start chatting</p>
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
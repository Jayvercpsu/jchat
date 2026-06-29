'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getUsers, addFriend, getFriends } from '@/lib/api';
import UserCard from './UserCard';

interface UserListProps {
  currentUserId: string;
  searchQuery: string;
}

export default function UserList({ currentUserId, searchQuery }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch users and friends
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');

      try {
        // Fetch all users
        const usersResult = await getUsers();
        if (usersResult.success && usersResult.data) {
          setUsers(usersResult.data.filter(u => u.id !== currentUserId));
        }

        // Fetch friends
        const friendsResult = await getFriends(currentUserId);
        if (friendsResult.success && friendsResult.data) {
          const ids = new Set(friendsResult.data.map(f => f.friendId));
          setFriendIds(ids);
        }
      } catch {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUserId]);

  // Filter by search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handleAddFriend = async (friendId: string) => {
    try {
      const result = await addFriend(currentUserId, friendId);
      if (result.success) {
        setFriendIds(prev => new Set([...prev, friendId]));
      }
    } catch {
      console.error('Failed to add friend');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
        <button
          onClick={() => window.location.reload()}
          className="block mx-auto mt-2 text-blue-500 hover:text-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {searchQuery ? 'No users found' : 'No users available'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          currentUserId={currentUserId}
          onAddFriend={handleAddFriend}
          isFriend={friendIds.has(user.id)}
        />
      ))}
    </div>
  );
}
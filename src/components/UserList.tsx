'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import {
  getUsers,
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  sendFriendRequest,
} from '@/lib/api';
import UserCard from './UserCard';

interface UserListProps {
  currentUserId: string;
  searchQuery: string;
}

type RelationshipStatus = 'none' | 'friend' | 'outgoing' | 'incoming';

export default function UserList({ currentUserId, searchQuery }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [outgoingRequestIds, setOutgoingRequestIds] = useState<Set<string>>(new Set());
  const [incomingRequestIds, setIncomingRequestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');

      try {
        const [usersResult, friendsResult, outgoingRequestsResult, incomingRequestsResult] =
          await Promise.all([
            getUsers(),
            getFriends(currentUserId),
            getOutgoingFriendRequests(currentUserId),
            getIncomingFriendRequests(currentUserId),
          ]);

        if (!usersResult.success || !usersResult.data) {
          throw new Error(usersResult.error || 'Failed to load users');
        }

        if (!friendsResult.success || !friendsResult.data) {
          throw new Error(friendsResult.error || 'Failed to load friends');
        }

        if (!outgoingRequestsResult.success || !outgoingRequestsResult.data) {
          throw new Error(outgoingRequestsResult.error || 'Failed to load friend requests');
        }

        if (!incomingRequestsResult.success || !incomingRequestsResult.data) {
          throw new Error(incomingRequestsResult.error || 'Failed to load friend requests');
        }

        setUsers(usersResult.data.filter((user) => user.id !== currentUserId));
        setFriendIds(new Set(friendsResult.data.map((friend) => friend.friendId)));
        setOutgoingRequestIds(
          new Set(outgoingRequestsResult.data.map((request) => request.receiverId))
        );
        setIncomingRequestIds(
          new Set(incomingRequestsResult.data.map((request) => request.senderId))
        );
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Failed to load users';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUserId]);

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  function getRelationshipStatus(userId: string): RelationshipStatus {
    if (friendIds.has(userId)) return 'friend';
    if (outgoingRequestIds.has(userId)) return 'outgoing';
    if (incomingRequestIds.has(userId)) return 'incoming';
    return 'none';
  }

  const handleSendRequest = async (friendId: string) => {
    setActionError('');

    try {
      const result = await sendFriendRequest(currentUserId, friendId);
      if (!result.success) {
        setActionError(result.error || 'Failed to send friend request');
        return;
      }

      setOutgoingRequestIds((previous) => new Set([...previous, friendId]));
    } catch {
      setActionError('Failed to send friend request');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
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
          className="mx-auto mt-2 block text-blue-500 hover:text-blue-600"
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
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {filteredUsers.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          currentUserId={currentUserId}
          onSendRequest={handleSendRequest}
          relationshipStatus={getRelationshipStatus(user.id)}
        />
      ))}
    </div>
  );
}

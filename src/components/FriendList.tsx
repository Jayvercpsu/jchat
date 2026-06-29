'use client';

import { useState, useEffect } from 'react';
import { User, Friend } from '@/lib/types';
import { getFriends, getUsers, getMessages } from '@/lib/api';
import FriendCard from './FriendCard';

interface FriendListProps {
  currentUserId: string;
  selectedFriendId: string | null;
  onSelectFriend: (friendId: string) => void;
  searchQuery: string;
}

interface FriendWithInfo {
  friend: User;
  friendRelation: Friend;
  lastMessage: string;
  lastMessageTime: string;
}

export default function FriendList({
  currentUserId,
  selectedFriendId,
  onSelectFriend,
  searchQuery,
}: FriendListProps) {
  const [friends, setFriends] = useState<FriendWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch friends with their info
  useEffect(() => {
    async function fetchFriends() {
      setLoading(true);
      setError('');

      try {
        // Get friend's list
        const friendsResult = await getFriends(currentUserId);
        if (!friendsResult.success || !friendsResult.data) {
          setError('Failed to load friends');
          setLoading(false);
          return;
        }

        // Get all users
        const usersResult = await getUsers();
        if (!usersResult.success || !usersResult.data) {
          setError('Failed to load users');
          setLoading(false);
          return;
        }

        const usersMap = new Map(usersResult.data.map(u => [u.id, u]));

        // Get last message for each friend
        const friendsWithInfoPromises = friendsResult.data.map(async (friendRelation) => {
          const friendUser = usersMap.get(friendRelation.friendId);
          if (!friendUser) return null;

          // Get last message
          const messagesResult = await getMessages(currentUserId, friendRelation.friendId);
          const messages = messagesResult.data || [];

          const lastMsg = messages[messages.length - 1];

          return {
            friend: friendUser,
            friendRelation,
            lastMessage: lastMsg?.text || '',
            lastMessageTime: lastMsg?.createdAt || '',
          };
        });

        const friendsWithInfoResults = await Promise.all(friendsWithInfoPromises);

        // Filter out nulls and sort by last message time
        const validFriends = friendsWithInfoResults
          .filter((f): f is FriendWithInfo => f !== null)
          .sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
          });

        setFriends(validFriends);
      } catch {
        setError('Failed to load friends');
      } finally {
        setLoading(false);
      }
    }

    fetchFriends();
  }, [currentUserId]);

  // Filter by search query
  const filteredFriends = friends.filter(friend => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return friend.friend.displayName.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
        Loading friends...
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

  if (filteredFriends.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {searchQuery ? 'No friends found' : 'No friends yet. Add someone!'}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredFriends.map(({ friend, lastMessage, lastMessageTime }) => (
        <FriendCard
          key={friend.id}
          user={friend}
          isSelected={selectedFriendId === friend.id}
          lastMessage={lastMessage}
          lastMessageTime={lastMessageTime}
          onClick={() => onSelectFriend(friend.id)}
        />
      ))}
    </div>
  );
}
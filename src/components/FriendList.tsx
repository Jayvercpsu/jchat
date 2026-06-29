'use client';

import { useState, useEffect } from 'react';
import { User, Friend, FriendRequest } from '@/lib/types';
import {
  getFriends,
  getUsers,
  getMessages,
  getIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from '@/lib/api';
import FriendCard from './FriendCard';
import FriendRequestCard from './FriendRequestCard';

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

interface IncomingRequestWithInfo {
  request: FriendRequest;
  sender: User;
}

export default function FriendList({
  currentUserId,
  selectedFriendId,
  onSelectFriend,
  searchQuery,
}: FriendListProps) {
  const [friends, setFriends] = useState<FriendWithInfo[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequestWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestActionId, setRequestActionId] = useState<string | null>(null);

  async function loadConnections() {
    setLoading(true);
    setError('');

    try {
      const [friendsResult, usersResult, requestsResult] = await Promise.all([
        getFriends(currentUserId),
        getUsers(),
        getIncomingFriendRequests(currentUserId),
      ]);

      if (!friendsResult.success || !friendsResult.data) {
        throw new Error(friendsResult.error || 'Failed to load friends');
      }

      if (!usersResult.success || !usersResult.data) {
        throw new Error(usersResult.error || 'Failed to load users');
      }

      if (!requestsResult.success || !requestsResult.data) {
        throw new Error(requestsResult.error || 'Failed to load friend requests');
      }

      const usersMap = new Map(usersResult.data.map((user) => [user.id, user]));

      const friendsWithInfoPromises = friendsResult.data.map(async (friendRelation) => {
        const friendUser = usersMap.get(friendRelation.friendId);
        if (!friendUser) return null;

        const messagesResult = await getMessages(currentUserId, friendRelation.friendId);
        if (!messagesResult.success) {
          return {
            friend: friendUser,
            friendRelation,
            lastMessage: '',
            lastMessageTime: '',
          };
        }

        const messages = messagesResult.data || [];
        const lastMessage = messages[messages.length - 1];

        return {
          friend: friendUser,
          friendRelation,
          lastMessage: lastMessage?.text || '',
          lastMessageTime: lastMessage?.createdAt || '',
        };
      });

      const friendsWithInfoResults = await Promise.all(friendsWithInfoPromises);

      const validFriends = friendsWithInfoResults
        .filter((friend): friend is FriendWithInfo => friend !== null)
        .sort((first, second) => {
          const firstTime = first.lastMessageTime
            ? new Date(first.lastMessageTime).getTime()
            : 0;
          const secondTime = second.lastMessageTime
            ? new Date(second.lastMessageTime).getTime()
            : 0;
          return secondTime - firstTime;
        });

      const validIncomingRequests = requestsResult.data
        .map((request) => {
          const sender = usersMap.get(request.senderId);
          if (!sender) return null;

          return { request, sender };
        })
        .filter((request): request is IncomingRequestWithInfo => request !== null);

      setFriends(validFriends);
      setIncomingRequests(validIncomingRequests);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Failed to load friends';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConnections();
  }, [currentUserId]);

  const filteredFriends = friends.filter((friend) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      friend.friend.displayName.toLowerCase().includes(query) ||
      friend.friend.email.toLowerCase().includes(query)
    );
  });

  const filteredIncomingRequests = incomingRequests.filter((incomingRequest) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      incomingRequest.sender.displayName.toLowerCase().includes(query) ||
      incomingRequest.sender.email.toLowerCase().includes(query)
    );
  });

  const handleAcceptRequest = async (requestId: string) => {
    setRequestActionId(requestId);
    setError('');

    try {
      const result = await acceptFriendRequest(requestId, currentUserId);
      if (!result.success) {
        setError(result.error || 'Failed to accept friend request');
        return;
      }

      await loadConnections();
    } catch {
      setError('Failed to accept friend request');
    } finally {
      setRequestActionId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setRequestActionId(requestId);
    setError('');

    try {
      const result = await declineFriendRequest(requestId, currentUserId);
      if (!result.success) {
        setError(result.error || 'Failed to decline friend request');
        return;
      }

      await loadConnections();
    } catch {
      setError('Failed to decline friend request');
    } finally {
      setRequestActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
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
          className="mx-auto mt-2 block text-blue-500 hover:text-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (filteredFriends.length === 0 && filteredIncomingRequests.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        {searchQuery ? 'No friends found' : 'No friends yet. Add someone!'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredIncomingRequests.length > 0 && (
        <section className="space-y-2">
          <div className="px-1">
            <h2 className="text-sm font-semibold text-gray-800">Friend Requests</h2>
            <p className="text-xs text-gray-500">Confirm or decline before chatting.</p>
          </div>

          <div className="space-y-2">
            {filteredIncomingRequests.map(({ request, sender }) => (
              <FriendRequestCard
                key={request.id}
                user={sender}
                onAccept={() => handleAcceptRequest(request.id)}
                onDecline={() => handleDeclineRequest(request.id)}
                loading={requestActionId === request.id}
              />
            ))}
          </div>
        </section>
      )}

      {filteredFriends.length > 0 && (
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
      )}
    </div>
  );
}

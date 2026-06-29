import {
  User,
  Friend,
  FriendRequest,
  Message,
  Session,
  ApiResponse,
  UserDisplay,
  MessageNotification,
} from './types';

type StorageRecord = {
  users: User[];
  friends: Friend[];
  friendRequests: FriendRequest[];
  messages: Message[];
};

const STORAGE_API_URL = '/api/storage';

type StorageReadOptions = {
  refresh?: boolean;
};

function createEmptyStore(): StorageRecord {
  return {
    users: [],
    friends: [],
    friendRequests: [],
    messages: [],
  };
}

// In-memory fallback when JSON storage is not available
let memoryStore: StorageRecord = createEmptyStore();

let useMemoryStore = false;
let storageInitialized = false;
let storageError = '';

function normalizeStorageRecord(data: unknown): StorageRecord | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Partial<StorageRecord>;
  if (
    !Array.isArray(record.users) ||
    !Array.isArray(record.friends) ||
    !Array.isArray(record.messages)
  ) {
    return null;
  }

  return {
    users: record.users as User[],
    friends: record.friends as Friend[],
    friendRequests: Array.isArray(record.friendRequests)
      ? (record.friendRequests as FriendRequest[])
      : [],
    messages: record.messages as Message[],
  };
}

function getConfiguredStorageError(): string | null {
  if (!useMemoryStore || !storageError) {
    return null;
  }

  return storageError;
}

function areUsersFriendsInStore(userId: string, friendId: string): boolean {
  return memoryStore.friends.some(
    (friend) => friend.userId === userId && friend.friendId === friendId
  );
}

function getPendingRequestBetweenUsers(
  firstUserId: string,
  secondUserId: string
): FriendRequest | undefined {
  return memoryStore.friendRequests.find(
    (request) =>
      request.status === 'pending' &&
      ((request.senderId === firstUserId && request.receiverId === secondUserId) ||
        (request.senderId === secondUserId && request.receiverId === firstUserId))
  );
}

function createFriendLink(userId: string, friendId: string): Friend {
  return {
    id: generateId(),
    userId,
    friendId,
    createdAt: new Date().toISOString(),
  };
}

// Initialize storage on first call, and refresh it when realtime screens need fresh data.
async function ensureStorageInitialized(forceRefresh = false): Promise<void> {
  if (storageInitialized && !forceRefresh) return;

  try {
    const response = await fetch(STORAGE_API_URL, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Storage API read failed with status ${response.status}`);
    }

    const data: unknown = await response.json();
    const normalizedRecord = normalizeStorageRecord(data);
    if (!normalizedRecord) {
      throw new Error('Storage API returned an unexpected data shape');
    }

    memoryStore = normalizedRecord;
    useMemoryStore = false;
    storageError = '';
    console.log('Using JSON bin storage');
  } catch (error) {
    useMemoryStore = true;
    storageError = 'Unable to connect to storage. Please try again.';
    console.error('JSONBin initialization failed', error);
  }

  storageInitialized = true;
}

async function prepareStorage(options: StorageReadOptions = {}): Promise<string | null> {
  await ensureStorageInitialized(options.refresh === true);
  return getConfiguredStorageError();
}

export async function refreshStorage(): Promise<ApiResponse<void>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to refresh storage' };
  }
}

// Helper to generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Helper to hash password (simple hash for demo - use proper hashing in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Save to storage (JSONBin)
async function saveToStorage(): Promise<void> {
  await ensureStorageInitialized();
  if (useMemoryStore) {
    throw new Error(storageError || 'Storage service is unavailable');
  }

  const response = await fetch(STORAGE_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(memoryStore),
  });

  if (!response.ok) {
    storageError = 'Failed to save data to storage.';
    throw new Error(`Storage API save failed with status ${response.status}`);
  }

  storageError = '';
}

// ========== USER OPERATIONS ==========

/**
 * Get all registered users
 */
export async function getUsers(
  options: StorageReadOptions = {}
): Promise<ApiResponse<User[]>> {
  try {
    const configuredStorageError = await prepareStorage(options);
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const usersWithoutPassword = memoryStore.users.map(
      ({ password: _, ...user }) => user as User
    );
    return { success: true, data: usersWithoutPassword };
  } catch {
    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Create a new user (signup)
 */
export async function createUser(
  email: string,
  password: string,
  displayName: string
): Promise<ApiResponse<User>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const existingUser = memoryStore.users.find((user) => user.email === email);
    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      id: generateId(),
      email,
      password: hashedPassword,
      displayName,
      createdAt: new Date().toISOString(),
    };

    memoryStore.users.push(newUser);
    try {
      await saveToStorage();
    } catch {
      memoryStore.users = memoryStore.users.filter((user) => user.id !== newUser.id);
      return {
        success: false,
        error: storageError || 'Failed to save your account.',
      };
    }

    const { password: _, ...userWithoutPassword } = newUser;
    return { success: true, data: userWithoutPassword as User };
  } catch {
    return { success: false, error: 'Failed to create user' };
  }
}

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<ApiResponse<User>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const user = memoryStore.users.find((entry) => entry.email === email);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword as User };
  } catch {
    return { success: false, error: 'Failed to login' };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(
  userId: string,
  options: StorageReadOptions = {}
): Promise<ApiResponse<User>> {
  try {
    const configuredStorageError = await prepareStorage(options);
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const user = memoryStore.users.find((entry) => entry.id === userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword as User };
  } catch {
    return { success: false, error: 'Failed to get user' };
  }
}

// ========== FRIEND OPERATIONS ==========

/**
 * Get friends for a user
 */
export async function getFriends(
  userId: string,
  options: StorageReadOptions = {}
): Promise<ApiResponse<Friend[]>> {
  try {
    const configuredStorageError = await prepareStorage(options);
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const userFriends = memoryStore.friends.filter((friend) => friend.userId === userId);
    return { success: true, data: userFriends };
  } catch {
    return { success: false, error: 'Failed to fetch friends' };
  }
}

/**
 * Get incoming friend requests
 */
export async function getIncomingFriendRequests(
  userId: string,
  options: StorageReadOptions = {}
): Promise<ApiResponse<FriendRequest[]>> {
  try {
    const configuredStorageError = await prepareStorage(options);
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const requests = memoryStore.friendRequests
      .filter((request) => request.receiverId === userId && request.status === 'pending')
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
      );

    return { success: true, data: requests };
  } catch {
    return { success: false, error: 'Failed to fetch friend requests' };
  }
}

/**
 * Get outgoing friend requests
 */
export async function getOutgoingFriendRequests(
  userId: string,
  options: StorageReadOptions = {}
): Promise<ApiResponse<FriendRequest[]>> {
  try {
    const configuredStorageError = await prepareStorage(options);
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const requests = memoryStore.friendRequests
      .filter((request) => request.senderId === userId && request.status === 'pending')
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
      );

    return { success: true, data: requests };
  } catch {
    return { success: false, error: 'Failed to fetch friend requests' };
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  senderId: string,
  receiverId: string
): Promise<ApiResponse<FriendRequest>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    if (senderId === receiverId) {
      return { success: false, error: 'You cannot add yourself' };
    }

    if (
      areUsersFriendsInStore(senderId, receiverId) ||
      areUsersFriendsInStore(receiverId, senderId)
    ) {
      return { success: false, error: 'Already friends' };
    }

    const receiverExists = memoryStore.users.some((user) => user.id === receiverId);
    if (!receiverExists) {
      return { success: false, error: 'User not found' };
    }

    const pendingRequest = getPendingRequestBetweenUsers(senderId, receiverId);
    if (pendingRequest) {
      if (pendingRequest.senderId === senderId) {
        return { success: false, error: 'Friend request already sent' };
      }

      return { success: false, error: 'This user already sent you a friend request' };
    }

    const newRequest: FriendRequest = {
      id: generateId(),
      senderId,
      receiverId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    memoryStore.friendRequests.push(newRequest);
    try {
      await saveToStorage();
    } catch {
      memoryStore.friendRequests = memoryStore.friendRequests.filter(
        (request) => request.id !== newRequest.id
      );
      return {
        success: false,
        error: storageError || 'Failed to send friend request.',
      };
    }

    return { success: true, data: newRequest };
  } catch {
    return { success: false, error: 'Failed to send friend request' };
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  requestId: string,
  userId: string
): Promise<ApiResponse<FriendRequest>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const request = memoryStore.friendRequests.find(
      (entry) =>
        entry.id === requestId && entry.receiverId === userId && entry.status === 'pending'
    );
    if (!request) {
      return { success: false, error: 'Friend request not found' };
    }

    const previousStatus = request.status;
    const previousRespondedAt = request.respondedAt;
    const createdFriends: Friend[] = [];

    request.status = 'accepted';
    request.respondedAt = new Date().toISOString();

    if (!areUsersFriendsInStore(request.senderId, request.receiverId)) {
      const firstFriendLink = createFriendLink(request.senderId, request.receiverId);
      memoryStore.friends.push(firstFriendLink);
      createdFriends.push(firstFriendLink);
    }

    if (!areUsersFriendsInStore(request.receiverId, request.senderId)) {
      const secondFriendLink = createFriendLink(request.receiverId, request.senderId);
      memoryStore.friends.push(secondFriendLink);
      createdFriends.push(secondFriendLink);
    }

    try {
      await saveToStorage();
    } catch {
      request.status = previousStatus;
      request.respondedAt = previousRespondedAt;
      memoryStore.friends = memoryStore.friends.filter(
        (friend) => !createdFriends.some((createdFriend) => createdFriend.id === friend.id)
      );
      return {
        success: false,
        error: storageError || 'Failed to accept friend request.',
      };
    }

    return { success: true, data: request };
  } catch {
    return { success: false, error: 'Failed to accept friend request' };
  }
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(
  requestId: string,
  userId: string
): Promise<ApiResponse<FriendRequest>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const request = memoryStore.friendRequests.find(
      (entry) =>
        entry.id === requestId && entry.receiverId === userId && entry.status === 'pending'
    );
    if (!request) {
      return { success: false, error: 'Friend request not found' };
    }

    const previousStatus = request.status;
    const previousRespondedAt = request.respondedAt;

    request.status = 'declined';
    request.respondedAt = new Date().toISOString();

    try {
      await saveToStorage();
    } catch {
      request.status = previousStatus;
      request.respondedAt = previousRespondedAt;
      return {
        success: false,
        error: storageError || 'Failed to decline friend request.',
      };
    }

    return { success: true, data: request };
  } catch {
    return { success: false, error: 'Failed to decline friend request' };
  }
}

/**
 * Add a friend directly
 */
export async function addFriend(
  userId: string,
  friendId: string
): Promise<ApiResponse<Friend>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const existingFriend = memoryStore.friends.find(
      (friend) => friend.userId === userId && friend.friendId === friendId
    );
    if (existingFriend) {
      return { success: false, error: 'Already friends' };
    }

    const userExists = memoryStore.users.some((user) => user.id === friendId);
    if (!userExists) {
      return { success: false, error: 'User not found' };
    }

    const newFriend = createFriendLink(userId, friendId);

    memoryStore.friends.push(newFriend);
    try {
      await saveToStorage();
    } catch {
      memoryStore.friends = memoryStore.friends.filter((friend) => friend.id !== newFriend.id);
      return {
        success: false,
        error: storageError || 'Failed to save your friend list.',
      };
    }

    return { success: true, data: newFriend };
  } catch {
    return { success: false, error: 'Failed to add friend' };
  }
}

/**
 * Check if users are already friends
 */
export async function areFriends(
  userId: string,
  friendId: string,
  options: StorageReadOptions = {}
): Promise<boolean> {
  await prepareStorage(options);
  return (
    areUsersFriendsInStore(userId, friendId) || areUsersFriendsInStore(friendId, userId)
  );
}

// ========== MESSAGE OPERATIONS ==========

/**
 * Get messages between two users
 */
export async function getMessages(
  userId1: string,
  userId2: string,
  options: StorageReadOptions = {}
): Promise<ApiResponse<Message[]>> {
  try {
    const configuredStorageError = await prepareStorage(options);
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    if (!areUsersFriendsInStore(userId1, userId2) && !areUsersFriendsInStore(userId2, userId1)) {
      return { success: false, error: 'You can only message accepted friends' };
    }

    const conversation = memoryStore.messages.filter(
      (message) =>
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
    );

    conversation.sort(
      (first, second) =>
        new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
    );

    return { success: true, data: conversation };
  } catch {
    return { success: false, error: 'Failed to fetch messages' };
  }
}

export async function getUnreadMessageNotifications(
  userId: string,
  options: StorageReadOptions = {}
): Promise<ApiResponse<MessageNotification[]>> {
  try {
    const configuredStorageError = await prepareStorage(options);
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const unreadBySender = new Map<string, Message[]>();
    memoryStore.messages.forEach((message) => {
      if (message.receiverId !== userId || message.readAt) return;

      const senderMessages = unreadBySender.get(message.senderId) || [];
      senderMessages.push(message);
      unreadBySender.set(message.senderId, senderMessages);
    });

    const notifications = Array.from(unreadBySender.entries())
      .map(([senderId, messages]) => {
        const sender = memoryStore.users.find((user) => user.id === senderId);
        if (!sender) return null;

        const sortedMessages = [...messages].sort(
          (first, second) =>
            new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
        );
        const latestMessage = sortedMessages[sortedMessages.length - 1];
        if (!latestMessage) return null;

        const { password: _, ...senderWithoutPassword } = sender;

        return {
          sender: senderWithoutPassword as UserDisplay,
          latestMessage,
          unreadCount: sortedMessages.length,
        };
      })
      .filter(
        (notification): notification is MessageNotification => notification !== null
      )
      .sort(
        (first, second) =>
          new Date(second.latestMessage.createdAt).getTime() -
          new Date(first.latestMessage.createdAt).getTime()
      );

    return { success: true, data: notifications };
  } catch {
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

export async function markMessagesAsRead(
  userId: string,
  senderId?: string
): Promise<ApiResponse<number>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const unreadMessages = memoryStore.messages.filter(
      (message) =>
        message.receiverId === userId &&
        !message.readAt &&
        (!senderId || message.senderId === senderId)
    );

    if (unreadMessages.length === 0) {
      return { success: true, data: 0 };
    }

    const previousReadValues = unreadMessages.map((message) => ({
      id: message.id,
      readAt: message.readAt,
    }));
    const readAt = new Date().toISOString();
    unreadMessages.forEach((message) => {
      message.readAt = readAt;
    });

    try {
      await saveToStorage();
    } catch {
      previousReadValues.forEach((previousValue) => {
        const message = memoryStore.messages.find(
          (entry) => entry.id === previousValue.id
        );
        if (message) {
          message.readAt = previousValue.readAt;
        }
      });

      return {
        success: false,
        error: storageError || 'Failed to mark messages as read.',
      };
    }

    return { success: true, data: unreadMessages.length };
  } catch {
    return { success: false, error: 'Failed to mark messages as read' };
  }
}

/**
 * Send a message
 */
export async function sendMessage(
  senderId: string,
  receiverId: string,
  text: string
): Promise<ApiResponse<Message>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    if (
      !areUsersFriendsInStore(senderId, receiverId) &&
      !areUsersFriendsInStore(receiverId, senderId)
    ) {
      return { success: false, error: 'You can only message accepted friends' };
    }

    const newMessage: Message = {
      id: generateId(),
      senderId,
      receiverId,
      text: text.trim(),
      liked: false,
      createdAt: new Date().toISOString(),
    };

    memoryStore.messages.push(newMessage);
    try {
      await saveToStorage();
    } catch {
      memoryStore.messages = memoryStore.messages.filter(
        (message) => message.id !== newMessage.id
      );
      return {
        success: false,
        error: storageError || 'Failed to send message.',
      };
    }

    return { success: true, data: newMessage };
  } catch {
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Toggle like on a message
 */
export async function toggleMessageLike(messageId: string): Promise<ApiResponse<Message>> {
  try {
    const configuredStorageError = await prepareStorage({ refresh: true });
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const message = memoryStore.messages.find((entry) => entry.id === messageId);
    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    const previousLikedValue = message.liked;
    message.liked = !message.liked;
    try {
      await saveToStorage();
    } catch {
      message.liked = previousLikedValue;
      return {
        success: false,
        error: storageError || 'Failed to update the message.',
      };
    }

    return { success: true, data: message };
  } catch {
    return { success: false, error: 'Failed to toggle like' };
  }
}

// ========== SESSION OPERATIONS ==========

/**
 * Save session to localStorage
 */
export function saveSession(session: Session): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jchat_session', JSON.stringify(session));
  }
}

/**
 * Get session from localStorage
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;

  const sessionStr = localStorage.getItem('jchat_session');
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr) as Session;
  } catch {
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jchat_session');
  }
}

// ========== SEARCH OPERATIONS ==========

/**
 * Search users by name or email
 */
export async function searchUsers(
  query: string,
  options: StorageReadOptions = {}
): Promise<ApiResponse<User[]>> {
  try {
    const configuredStorageError = await prepareStorage(options);
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const lowerQuery = query.toLowerCase();
    const filtered = memoryStore.users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    );

    const sanitized = filtered.map(({ password: _, ...user }) => user as User);
    return { success: true, data: sanitized };
  } catch {
    return { success: false, error: 'Failed to search users' };
  }
}

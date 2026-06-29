import { User, Friend, Message, Session, ApiResponse } from './types';

type StorageRecord = {
  users: User[];
  friends: Friend[];
  messages: Message[];
};

// JSONBin REST API base URL
const API_BASE_URL = 'https://api.jsonbin.io/v3';
const BIN_ID = process.env.NEXT_PUBLIC_JSON_BIN_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_JSON_API_KEY || '';
const HAS_JSON_BIN_CONFIG = Boolean(BIN_ID && API_KEY);

function createEmptyStore(): StorageRecord {
  return {
    users: [],
    friends: [],
    messages: [],
  };
}

// In-memory fallback when JSON storage is not available
let memoryStore: StorageRecord = createEmptyStore();

let useMemoryStore = true;
let storageInitialized = false;
let storageError = '';

function getStorageHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
  return {
    'X-Access-Key': API_KEY,
    ...extraHeaders,
  };
}

function isStorageRecord(data: unknown): data is StorageRecord {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const record = data as Partial<StorageRecord>;
  return (
    Array.isArray(record.users) &&
    Array.isArray(record.friends) &&
    Array.isArray(record.messages)
  );
}

function getConfiguredStorageError(): string | null {
  if (!HAS_JSON_BIN_CONFIG || !useMemoryStore || !storageError) {
    return null;
  }

  return storageError;
}

// Initialize storage on first call
async function ensureStorageInitialized(): Promise<void> {
  if (storageInitialized) return;

  if (!HAS_JSON_BIN_CONFIG) {
    useMemoryStore = true;
    console.log('Using in-memory store (no JSON bin configured)');
  } else {
    try {
      const response = await fetch(`${API_BASE_URL}/b/${BIN_ID}?meta=false`, {
        headers: getStorageHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`JSONBin read failed with status ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!isStorageRecord(data)) {
        throw new Error('JSONBin returned an unexpected data shape');
      }

      memoryStore = data;
      useMemoryStore = false;
      storageError = '';
      console.log('Using JSON bin storage');
    } catch (error) {
      useMemoryStore = true;
      storageError = 'Unable to connect to JSONBin. Check your bin ID and access key.';
      console.error('JSONBin initialization failed', error);
    }
  }

  storageInitialized = true;
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
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Save to storage (JSONBin)
async function saveToStorage(): Promise<void> {
  await ensureStorageInitialized();
  if (!HAS_JSON_BIN_CONFIG) return;
  if (useMemoryStore) {
    throw new Error(storageError || 'JSONBin storage is unavailable');
  }

  const response = await fetch(`${API_BASE_URL}/b/${BIN_ID}`, {
    method: 'PUT',
    headers: getStorageHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(memoryStore),
  });

  if (!response.ok) {
    storageError = 'Failed to save data to JSONBin.';
    throw new Error(`JSONBin save failed with status ${response.status}`);
  }

  storageError = '';
}

// ========== USER OPERATIONS ==========

/**
 * Get all registered users
 */
export async function getUsers(): Promise<ApiResponse<User[]>> {
  try {
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const usersWithoutPassword = memoryStore.users.map(({ password: _, ...user }) => user as User);
    return { success: true, data: usersWithoutPassword };
  } catch (error) {
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
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    // Check if email exists
    const existingUser = memoryStore.users.find(u => u.email === email);
    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }

    // Validate password
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
      memoryStore.users = memoryStore.users.filter(user => user.id !== newUser.id);
      return {
        success: false,
        error: storageError || 'Failed to save your account.',
      };
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return { success: true, data: userWithoutPassword as User };
  } catch (error) {
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
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const user = memoryStore.users.find(u => u.email === email);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword as User };
  } catch (error) {
    return { success: false, error: 'Failed to login' };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<ApiResponse<User>> {
  try {
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const { password: _, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword as User };
  } catch (error) {
    return { success: false, error: 'Failed to get user' };
  }
}

// ========== FRIEND OPERATIONS ==========

/**
 * Get friends for a user
 */
export async function getFriends(userId: string): Promise<ApiResponse<Friend[]>> {
  try {
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const userFriends = memoryStore.friends.filter(f => f.userId === userId);
    return { success: true, data: userFriends };
  } catch (error) {
    return { success: false, error: 'Failed to fetch friends' };
  }
}

/**
 * Add a friend
 */
export async function addFriend(
  userId: string,
  friendId: string
): Promise<ApiResponse<Friend>> {
  try {
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    // Check if already friends
    const existingFriend = memoryStore.friends.find(
      f => f.userId === userId && f.friendId === friendId
    );
    if (existingFriend) {
      return { success: false, error: 'Already friends' };
    }

    // Check if user exists
    const userExists = memoryStore.users.some(u => u.id === friendId);
    if (!userExists) {
      return { success: false, error: 'User not found' };
    }

    const newFriend: Friend = {
      id: generateId(),
      userId,
      friendId,
      createdAt: new Date().toISOString(),
    };

    memoryStore.friends.push(newFriend);
    try {
      await saveToStorage();
    } catch {
      memoryStore.friends = memoryStore.friends.filter(friend => friend.id !== newFriend.id);
      return {
        success: false,
        error: storageError || 'Failed to save your friend list.',
      };
    }

    return { success: true, data: newFriend };
  } catch (error) {
    return { success: false, error: 'Failed to add friend' };
  }
}

/**
 * Check if users are already friends
 */
export async function areFriends(
  userId: string,
  friendId: string
): Promise<boolean> {
  const existingFriend = memoryStore.friends.find(
    f => f.userId === userId && f.friendId === friendId
  );
  return !!existingFriend;
}

// ========== MESSAGE OPERATIONS ==========

/**
 * Get messages between two users
 */
export async function getMessages(
  userId1: string,
  userId2: string
): Promise<ApiResponse<Message[]>> {
  try {
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const conversation = memoryStore.messages.filter(
      m =>
        (m.senderId === userId1 && m.receiverId === userId2) ||
        (m.senderId === userId2 && m.receiverId === userId1)
    );
    // Sort by createdAt ascending
    conversation.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return { success: true, data: conversation };
  } catch (error) {
    return { success: false, error: 'Failed to fetch messages' };
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
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
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
      memoryStore.messages = memoryStore.messages.filter(message => message.id !== newMessage.id);
      return {
        success: false,
        error: storageError || 'Failed to send message.',
      };
    }

    return { success: true, data: newMessage };
  } catch (error) {
    return { success: false, error: 'Failed to send message' };
  }
}

/**
 * Toggle like on a message
 */
export async function toggleMessageLike(messageId: string): Promise<ApiResponse<Message>> {
  try {
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const message = memoryStore.messages.find(m => m.id === messageId);
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
  } catch (error) {
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
export async function searchUsers(query: string): Promise<ApiResponse<User[]>> {
  try {
    await ensureStorageInitialized();
    const configuredStorageError = getConfiguredStorageError();
    if (configuredStorageError) {
      return { success: false, error: configuredStorageError };
    }

    const lowerQuery = query.toLowerCase();
    const filtered = memoryStore.users.filter(
      u =>
        u.displayName.toLowerCase().includes(lowerQuery) ||
        u.email.toLowerCase().includes(lowerQuery)
    );
    // Remove passwords
    const sanitized = filtered.map(({ password: _, ...user }) => user as User);
    return { success: true, data: sanitized };
  } catch (error) {
    return { success: false, error: 'Failed to search users' };
  }
}

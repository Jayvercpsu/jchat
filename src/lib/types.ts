// User type representing a registered user
export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  createdAt: string; // ISO date string
}

// Friend type representing a friend relationship
export interface Friend {
  id: string;
  userId: string; // who added the friend
  friendId: string; // the user who was added
  createdAt: string; // ISO date string
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

// Message type representing a chat message
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  liked: boolean;
  createdAt: string; // ISO date string
  readAt?: string; // ISO date string
}

// Session type for localStorage
export interface Session {
  userId: string;
  email: string;
  displayName: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form props for authentication
export interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
}

// Chat message display props
export interface MessageDisplay {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  liked: boolean;
  createdAt: string;
  isOwn: boolean;
}

// User display props (without password)
export interface UserDisplay {
  id: string;
  email: string;
  displayName: string;
}

// Friend display props with user info
export interface FriendDisplay {
  id: string;
  friend: UserDisplay;
  createdAt: string;
}

export interface MessageNotification {
  sender: UserDisplay;
  latestMessage: Message;
  unreadCount: number;
}

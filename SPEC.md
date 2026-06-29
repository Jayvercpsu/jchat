# JChat - Simple Messaging App Specification

## 1. Project Overview

- **Project Name**: JChat
- **Project Type**: Simple messaging web application
- **Core Functionality**: A minimal messaging app with user registration, friends, and chat functionality using JSON storage
- **Target Users**: Anyone needing a simple chat application for demo/prototype purposes
- **Tech Stack**: Next.js 15+, React, TypeScript, Tailwind CSS
- **Deployment**: Vercel Free (serverless)

---

## 2. UI/UX Specification

### Layout Structure

**Login/Signup Pages**
- Single centered card (max-width: 400px)
- Logo/app name at top
- Form fields below
- Submit button
- Switch link (login/signup)

**Home Screen (After Login)**
```
+--------------------------------------------------+
|  TopBar: [AppName] [Search] [Logout]            |
+--------------------------------------------------+
|         |                                        |
| Friends |  Chat Area (when friend selected)      |
|  List   |  or                                     |
|         |  Welcome message (when no friend)      |
|         |                                        |
+--------------------------------------------------+
```

**Responsive Breakpoints**
- Mobile: < 768px (stack layout, show either friends or chat)
- Tablet: 768px - 1024px (narrow sidebars)
- Desktop: > 1024px (full layout)

### Visual Design

**Color Palette**
- Background: #FFFFFF (white)
- Surface/Card: #FFFFFF
- Primary: #3B82F6 (blue-500)
- Primary Hover: #2563EB (blue-600)
- Text Primary: #1F2937 (gray-800)
- Text Secondary: #6B7280 (gray-500)
- Border: #E5E7EB (gray-200)
- Success: #10B981 (green-500)
- Error: #EF4444 (red-500)
- Message Sent: #3B82F6 (blue-500)
- Message Received: #F3F4F6 (gray-100)
- Like Active: #EF4444 (red-500)

**Typography**
- Font Family: system-ui, -apple-system, sans-serif
- Heading (App Name): 24px, font-weight: 700
- Card Title: 18px, font-weight: 600
- Body: 14px, font-weight: 400
- Small/Caption: 12px, font-weight: 400

**Spacing System**
- Base unit: 4px
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- 2XL: 48px

**Visual Effects**
- Card shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
- Hover shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
- Border radius: 8px (cards), 6px (buttons), 20px (message bubbles)
- No animations, no dark mode, no gradients, no glassmorphism

### Components

**TopBar**
- Height: 56px
- Fixed at top
- Contains: App name (left), Search input (center), Logout button (right)

**AuthForm**
- Centered card
- Fields: email input, password input, display name (signup only)
- Submit button full width
- Link to switch between login/signup

**UserCard**
- Avatar: circular, 40px, background primary color, white text (initial)
- Display name (bold), email (gray, small)
- Add Friend button (blue, small)

**FriendCard**
- Similar to UserCard but without add button
- Clickable to open chat
- Selected state: light blue background

**MessageBubble**
- Max width: 70% of container
- Sent messages: right aligned, blue background, white text
- Received messages: left aligned, gray background, dark text
- Timestamp below: small, gray
- Heart button: small, appears on hover

**ChatInput**
- Full width input
- Emoji button (left)
- Send button (right)
- Border top

**EmojiPicker**
- Popup overlay
- Grid of emojis (4 columns)
- Click to insert into input

**SearchBar**
- Input with search icon
- Placeholder text
- Clear button when has text

---

## 3. Functionality Specification

### Core Features

**Authentication**
- Email (Gmail) + Password + Display Name (signup)
- Password minimum 6 characters
- Email must be unique (signup)
- Session stored in localStorage
- Auto-login on app load if session exists
- Logout clears session

**User Management**
- View all registered users
- Search users by name or email
- Pagination (20 users per page)
- Cannot add yourself

**Friend System**
- One-way friend system
- Click Add Friend to add user as friend
- Friend appears immediately in Friends List
- Already-added friends hidden from user list

**Messaging**
- Click friend to open conversation
- Text messages only
- Timestamps for each message
- Enter key sends message
- Send button sends message

**Emoji Picker**
- Simple grid of common emojis
- Click emoji to insert into input
- Emojis: 😀 😁 😂 🤣 😊 😍 ❤️ 👍 👎 😭 😎 🔥 🎉

**Like Messages**
- Each message has heart button
- Click to toggle like/unlike
- Heart turns red when liked
- Updated in JSON storage

**Search**
- Search users by name/email
- Search friends by name
- Instant filtering as user types

### Data Handling

**JSON Storage Schema**
```typescript
// User
{
  id: string,
  email: string,
  password: string,
  displayName: string,
  createdAt: string // ISO date
}

// Friend
{
  id: string,
  userId: string, // who added
  friendId: string, // who was added
  createdAt: string // ISO date
}

// Message
{
  id: string,
  senderId: string,
  receiverId: string,
  text: string,
  liked: boolean,
  createdAt: string // ISO date
}
```

**API Operations**
- GET /users - fetch all users
- POST /users - create user
- GET /friends?userId=xxx - fetch friends for user
- POST /friends - add friend
- GET /messages?senderId=xxx&receiverId=yyy - fetch conversation
- POST /messages - send message
- PUT /messages/:id - toggle like

### Edge Cases

- Empty friends list: show "No friends yet"
- Empty user list: show "No users found"
- No messages: show "Start a conversation"
- No friend selected: show welcome message
- Failed API: show error toast, allow retry
- Network error: show offline message
- Invalid session: redirect to login

---

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Login/signup forms are centered and responsive
- [ ] Home screen shows friends list on left, chat on right (or stacked on mobile)
- [ ] Messages display correctly (sent right, received left)
- [ ] Emoji picker opens and inserts emojis
- [ ] Search filters instantly
- [ ] Like button toggles correctly

### Functional Checkpoints
- [ ] User can sign up with email/password/name
- [ ] User can log in with email/password
- [ ] Session persists across page refresh
- [ ] User can add friends
- [ ] User can send messages
- [ ] User can receive messages
- [ ] User can like/unlike messages
- [ ] User can search users and friends
- [ ] User can log out

### Performance Checkpoints
- [ ] App loads within 3 seconds
- [ ] No unnecessary re-renders
- [ ] Proper loading states
- [ ] Error handling on all API calls

---

## 5. Folder Structure

```
/jchat
├── /src
│   ├── /app
│   │   ├── /login
│   │   │   └── page.tsx
│   │   ├── /signup
│   │   │   └── page.tsx
│   │   ├── /chat
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── /components
│   │   ├── TopBar.tsx
│   │   ├── AuthForm.tsx
│   │   ├── UserList.tsx
│   │   ├── UserCard.tsx
│   │   ├── FriendList.tsx
│   │   ├── FriendCard.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── EmojiPicker.tsx
│   │   └── SearchBar.tsx
│   ├── /lib
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── /styles
│       └── globals.css
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

---

## 6. Notes

- JSON storage is for demo purposes only
- Code is structured with service layer for easy backend swap
- Use environment variables for API URLs
- All timestamps use ISO format
- Email validation: basic format check
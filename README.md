# JChat - Simple Messaging App

A simple messaging web application built with Next.js 15+, React, TypeScript, and Tailwind CSS. Uses in-memory storage for demo purposes (can be swapped to real backend).

## Features

- **Authentication**: Email/password signup and login with session persistence
- **Friends**: Add friends and view friend list
- **Messaging**: Real-time text chat with message bubbles
- **Emoji Picker**: Insert emojis into messages
- **Like Messages**: Toggle like on messages with heart button
- **Search**: Filter users and friends by name
- **Responsive Design**: Works on mobile and desktop

## Tech Stack

- Next.js 15+ (App Router)
- React 19
- TypeScript
- Tailwind CSS
- In-memory storage (demo) / JSON storage ready

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
# Clone the repository
cd jchat

# Install dependencies
npm install
```

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## Deployment to Vercel

1. Push your code to a GitHub repository
2. Go to [Vercel.com](https://vercel.com) and sign in
3. Click "Add New..." > "Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Click "Deploy"

Your app will be deployed to a free Vercel URL.

## Project Structure

```
/src
  /app              - Next.js pages
    /login         - Login page
    /signup        - Signup page
    layout.tsx    - Root layout
    page.tsx      - Home page
  /components      - React components
    AuthForm.tsx  - Authentication form
    TopBar.tsx    - Top navigation bar
    UserList.tsx  - User directory
    UserCard.tsx  - User card component
    FriendList.tsx - Friends list
    FriendCard.tsx- Friend card component
    ChatWindow.tsx- Chat area
    MessageBubble.tsx - Message bubble
    ChatInput.tsx  - Message input
    EmojiPicker.tsx - Emoji picker popup
  /lib             - Utilities
    api.ts         - API functions
    types.ts       - TypeScript types
    utils.ts       - Helper functions
  /styles
    globals.css    - Global styles
```

## Configuration

### Environment Variables (Optional)

For JSON storage integration:

```env
NEXT_PUBLIC_JSON_BIN_ID=your_bin_id
NEXT_PUBLIC_JSON_API_KEY=your_api_key
```

### Swapping to Real Backend

The API functions in `src/lib/api.ts` use an in-memory store by default. To swap to a real backend:

1. Replace the API calls in `api.ts` to use your backend URL
2. Example: Firebase, Supabase, PostgreSQL, etc.
3. No UI changes needed - the service layer abstracts the backend

## License

MIT# jchat
# jchat

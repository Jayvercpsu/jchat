import { NextResponse } from 'next/server';
import { User, Friend, FriendRequest, Message } from '@/lib/types';

type StorageRecord = {
  users: User[];
  friends: Friend[];
  friendRequests: FriendRequest[];
  messages: Message[];
};

export const dynamic = 'force-dynamic';

const JSONBIN_API_BASE_URL = 'https://api.jsonbin.io/v3';
const BIN_ID = process.env.JSON_BIN_ID || process.env.NEXT_PUBLIC_JSON_BIN_ID || '';
const API_KEY = normalizeApiKey(
  process.env.JSON_BIN_ACCESS_KEY || process.env.NEXT_PUBLIC_JSON_API_KEY || ''
);

function normalizeApiKey(apiKey: string): string {
  return apiKey.replace(/\\\$/g, '$');
}

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

function getStorageHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
  return {
    'X-Access-Key': API_KEY,
    ...extraHeaders,
  };
}

function ensureConfig(): string | null {
  if (!BIN_ID || !API_KEY) {
    return 'JSONBin is not configured on the server.';
  }

  return null;
}

export async function GET() {
  const configError = ensureConfig();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  try {
    const response = await fetch(`${JSONBIN_API_BASE_URL}/b/${BIN_ID}?meta=false`, {
      headers: getStorageHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `JSONBin read failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();
    const normalizedRecord = normalizeStorageRecord(data);
    if (!normalizedRecord) {
      return NextResponse.json(
        { error: 'JSONBin returned an unexpected data shape.' },
        { status: 500 }
      );
    }

    return NextResponse.json(normalizedRecord);
  } catch (error) {
    console.error('Storage route GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch storage data.' }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  const configError = ensureConfig();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  try {
    const body: unknown = await request.json();
    const normalizedRecord = normalizeStorageRecord(body);
    if (!normalizedRecord) {
      return NextResponse.json({ error: 'Invalid storage payload.' }, { status: 400 });
    }

    const response = await fetch(`${JSONBIN_API_BASE_URL}/b/${BIN_ID}`, {
      method: 'PUT',
      headers: getStorageHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(normalizedRecord),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `JSONBin save failed with status ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Storage route PUT failed', error);
    return NextResponse.json({ error: 'Failed to save storage data.' }, { status: 502 });
  }
}

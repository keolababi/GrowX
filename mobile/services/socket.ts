import { io, type Socket } from 'socket.io-client';
import { API_URL } from '@/constants/config';
import { tokenStorage } from './token';

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  const token = await tokenStorage.get();

  if (!token) {
    throw new Error('Socket холбоход нэвтрэх шаардлагатай.');
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    });
  } else {
    socket.auth = {
      token,
    };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) return;

  socket.disconnect();
  socket = null;
}

import { Server } from 'socket.io';
import { getAuth } from '../config/firebase.js';
import { getSession } from '../services/interview.service.js';

let io;
const sessionTimers = new Map();

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    socket.on('join:session', async ({ sessionId }) => {
      const firebaseAuth = getAuth();
      if (firebaseAuth) {
        const token = socket.handshake.auth?.token;
        if (!token) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }
        try {
          const decoded = await firebaseAuth.verifyIdToken(token);
          const session = getSession(sessionId);
          if (!session || session.userId !== decoded.uid) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }
        } catch {
          socket.emit('error', { message: 'Invalid token' });
          return;
        }
      }

      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined session ${sessionId}`);

      // Start one shared timer per session
      if (!sessionTimers.has(sessionId)) {
        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          io.to(sessionId).emit('interview:timer', { elapsed });
        }, 1000);
        sessionTimers.set(sessionId, interval);
      }
    });

    socket.on('leave:session', ({ sessionId }) => {
      socket.leave(sessionId);
      cleanupTimer(sessionId);
    });

    socket.on('disconnect', () => {
      // Clean up timers for any rooms that are now empty
      for (const [sessionId] of sessionTimers.entries()) {
        cleanupTimer(sessionId);
      }
    });
  });

  return io;
}

function cleanupTimer(sessionId) {
  const room = io?.sockets.adapter.rooms.get(sessionId);
  if (!room || room.size === 0) {
    const interval = sessionTimers.get(sessionId);
    if (interval) {
      clearInterval(interval);
      sessionTimers.delete(sessionId);
    }
  }
}

export function getIO() {
  return io;
}

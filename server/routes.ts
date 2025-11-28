import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import type { WebRTCSignal } from "@shared/schema";
import { z } from "zod";

const signalSchema = z.object({
  type: z.enum([
    'offer', 'answer', 'ice-candidate', 'join-room', 'user-joined', 'user-left',
    'chat-message', 'file-transfer-offer', 'file-transfer-chunk', 'file-transfer-complete',
    'whiteboard-event', 'request-whiteboard-access', 'whiteboard-access-response',
    'typing-indicator', 'ping', 'pong'
  ]),
  roomCode: z.string().min(1).max(30).regex(/^[a-z0-9-]+$/),
  userId: z.string().min(1).max(100),
  data: z.any().optional()
});

const chatDataSchema = z.object({
  content: z.string().min(1).max(2000),
  senderId: z.string().optional(),
  senderName: z.string().max(50).optional(),
  timestamp: z.number().optional()
});

const whiteboardEventSchema = z.object({
  type: z.enum(['draw', 'erase', 'undo', 'clear']),
  data: z.object({
    x: z.number().min(-10000).max(10000).optional(),
    y: z.number().min(-10000).max(10000).optional(),
    prevX: z.number().min(-10000).max(10000).optional(),
    prevY: z.number().min(-10000).max(10000).optional(),
    color: z.string().max(20).optional(),
    lineWidth: z.number().min(1).max(100).optional(),
    strokeId: z.string().max(50).optional()
  }).optional(),
  timestamp: z.number().optional()
});

const fileTransferOfferSchema = z.object({
  id: z.string().max(100),
  fileName: z.string().max(255),
  fileSize: z.number().min(0).max(100 * 1024 * 1024),
  fileType: z.string().max(100),
  senderId: z.string().max(100).optional(),
  senderName: z.string().max(50).optional()
});

const fileTransferChunkSchema = z.object({
  transferId: z.string().max(100),
  chunk: z.string().max(65536),
  chunkIndex: z.number().min(0).max(100000)
});

const typingIndicatorSchema = z.object({
  isTyping: z.boolean(),
  userId: z.string().max(100).optional()
});

const iceDataSchema = z.object({
  candidate: z.object({
    candidate: z.string().optional(),
    sdpMid: z.string().nullable().optional(),
    sdpMLineIndex: z.number().nullable().optional(),
    usernameFragment: z.string().nullable().optional()
  }).optional(),
  targetPeerId: z.string().max(100).optional()
});

const sdpDataSchema = z.object({
  offer: z.object({
    type: z.string(),
    sdp: z.string().optional()
  }).optional(),
  answer: z.object({
    type: z.string(),
    sdp: z.string().optional()
  }).optional(),
  targetPeerId: z.string().max(100).optional()
});

interface ParticipantConnection {
  oderId: string;
  userName: string;
  ws: WebSocket;
  isHost: boolean;
  hasWhiteboardAccess: boolean;
  lastPing: number;
}

interface Room {
  code: string;
  participants: Map<string, ParticipantConnection>;
  createdAt: number;
}

interface ConnectionState {
  userId: string | null;
  roomCode: string | null;
  messageCount: number;
  lastMessageTime: number;
  joinedAt: number;
  ip: string;
}

const rooms = new Map<string, Room>();
const wsConnectionMap = new WeakMap<WebSocket, ConnectionState>();
const userIdToWs = new Map<string, WebSocket>();
const ipConnectionCount = new Map<string, number>();
const CONNECTION_TIMEOUT = 30000;
const MAX_ROOMS = 1000;
const MAX_PARTICIPANTS_PER_ROOM = 50;
const MAX_MESSAGE_SIZE = 65536;
const MAX_CHAT_LENGTH = 2000;
const MAX_USERNAME_LENGTH = 50;
const RATE_LIMIT_WINDOW = 1000;
const RATE_LIMIT_MAX_MESSAGES = 30;
const MAX_CONNECTIONS_PER_IP = 10;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
               req.socket.remoteAddress || 
               'unknown';
    
    const currentCount = ipConnectionCount.get(ip) || 0;
    if (currentCount >= MAX_CONNECTIONS_PER_IP) {
      ws.close(1013, 'Too many connections from this IP');
      return;
    }
    ipConnectionCount.set(ip, currentCount + 1);

    const connState: ConnectionState = {
      userId: null,
      roomCode: null,
      messageCount: 0,
      lastMessageTime: Date.now(),
      joinedAt: Date.now(),
      ip
    };
    wsConnectionMap.set(ws, connState);

    ws.on('message', (data: Buffer) => {
      const state = wsConnectionMap.get(ws);
      if (!state) return;

      if (data.length > MAX_MESSAGE_SIZE) {
        ws.close(1009, 'Message too large');
        return;
      }

      const now = Date.now();
      const elapsed = now - state.lastMessageTime;
      if (elapsed >= RATE_LIMIT_WINDOW) {
        state.messageCount = 1;
        state.lastMessageTime = now;
      } else {
        state.messageCount++;
        if (state.messageCount > RATE_LIMIT_MAX_MESSAGES) {
          ws.close(1008, 'Rate limit exceeded');
          return;
        }
      }

      try {
        const rawData = data.toString();
        if (!/^[\x20-\x7E\s]*$/.test(rawData.slice(0, 100))) {
          return;
        }
        
        const parsed = JSON.parse(rawData);
        const validationResult = signalSchema.safeParse(parsed);
        if (!validationResult.success) {
          return;
        }
        
        const signal = validationResult.data as WebRTCSignal;
        const { type, roomCode, userId } = signal;

        if (state.userId && state.userId !== userId) {
          return;
        }

        switch (type) {
          case 'join-room':
            const userName = sanitizeUserName(signal.data?.userName);
            const joinResult = handleJoinRoom(ws, roomCode, userId, userName);
            if (joinResult) {
              state.userId = userId;
              state.roomCode = roomCode;
              userIdToWs.set(userId, ws);
            }
            break;

          case 'ping':
            if (state.userId === userId && state.roomCode === roomCode) {
              handlePing(roomCode, userId, ws);
            }
            break;

          case 'offer':
          case 'answer':
            if (state.userId === userId && state.roomCode === roomCode) {
              const sdpValid = sdpDataSchema.safeParse(signal.data);
              if (sdpValid.success) {
                relaySignalToTarget(roomCode, userId, signal);
              }
            }
            break;

          case 'ice-candidate':
            if (state.userId === userId && state.roomCode === roomCode) {
              const iceValid = iceDataSchema.safeParse(signal.data);
              if (iceValid.success) {
                relaySignalToTarget(roomCode, userId, signal);
              }
            }
            break;

          case 'chat-message':
            if (state.userId === userId && state.roomCode === roomCode) {
              const sanitized = sanitizeChatMessage(signal);
              if (sanitized) {
                broadcastToRoom(roomCode, userId, sanitized);
              }
            }
            break;

          case 'file-transfer-offer':
            if (state.userId === userId && state.roomCode === roomCode) {
              const offerValid = fileTransferOfferSchema.safeParse(signal.data);
              if (offerValid.success) {
                broadcastToRoom(roomCode, userId, signal);
              }
            }
            break;

          case 'file-transfer-chunk':
            if (state.userId === userId && state.roomCode === roomCode) {
              const chunkValid = fileTransferChunkSchema.safeParse(signal.data);
              if (chunkValid.success) {
                broadcastToRoom(roomCode, userId, signal);
              }
            }
            break;

          case 'file-transfer-complete':
            if (state.userId === userId && state.roomCode === roomCode) {
              if (typeof signal.data?.transferId === 'string' && signal.data.transferId.length <= 100) {
                broadcastToRoom(roomCode, userId, signal);
              }
            }
            break;

          case 'typing-indicator':
            if (state.userId === userId && state.roomCode === roomCode) {
              const typingValid = typingIndicatorSchema.safeParse(signal.data);
              if (typingValid.success) {
                broadcastToRoom(roomCode, userId, signal);
              }
            }
            break;

          case 'whiteboard-event':
            if (state.userId === userId && state.roomCode === roomCode) {
              if (signal.data?.event) {
                const wbValidation = whiteboardEventSchema.safeParse(signal.data.event);
                if (wbValidation.success) {
                  broadcastToRoom(roomCode, userId, signal);
                }
              }
            }
            break;

          case 'request-whiteboard-access':
            if (state.userId === userId && state.roomCode === roomCode) {
              handleWhiteboardAccessRequest(roomCode, userId, signal);
            }
            break;

          case 'whiteboard-access-response':
            if (state.userId === userId && state.roomCode === roomCode) {
              handleWhiteboardAccessResponse(roomCode, signal);
            }
            break;

          default:
            break;
        }
      } catch (_error) {
        // Invalid JSON, ignore
      }
    });

    ws.on('close', () => {
      const state = wsConnectionMap.get(ws);
      if (state) {
        const count = ipConnectionCount.get(state.ip) || 1;
        if (count <= 1) {
          ipConnectionCount.delete(state.ip);
        } else {
          ipConnectionCount.set(state.ip, count - 1);
        }
        
        if (state.userId && state.roomCode) {
          userIdToWs.delete(state.userId);
          handleLeaveRoom(state.roomCode, state.userId);
        }
      }
    });

    ws.on('error', () => {
      // Connection error, cleanup handled by close event
    });
  });

  function sanitizeUserName(name: unknown): string {
    if (typeof name !== 'string') return 'Guest';
    return name
      .slice(0, MAX_USERNAME_LENGTH)
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/[<>&"'\\]/g, '')
      .trim() || 'Guest';
  }

  function sanitizeChatMessage(signal: WebRTCSignal): WebRTCSignal | null {
    const validation = chatDataSchema.safeParse(signal.data);
    if (!validation.success) {
      return null;
    }
    
    const cleanContent = validation.data.content
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .slice(0, MAX_CHAT_LENGTH);
    
    if (!cleanContent.trim()) {
      return null;
    }
    
    return {
      ...signal,
      data: {
        ...signal.data,
        content: cleanContent
      }
    };
  }

  function handlePing(roomCode: string, oderId: string, ws: WebSocket) {
    const room = rooms.get(roomCode);
    if (room) {
      const participant = room.participants.get(oderId);
      if (participant) {
        participant.lastPing = Date.now();
      }
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'pong',
        roomCode,
        userId: oderId,
        data: {}
      }));
    }
  }

  function handleJoinRoom(ws: WebSocket, roomCode: string, oderId: string, userName: string): boolean {
    const existingWs = userIdToWs.get(oderId);
    if (existingWs && existingWs !== ws && existingWs.readyState === WebSocket.OPEN) {
      ws.close(1008, 'User ID already in use');
      return false;
    }

    let room = rooms.get(roomCode);
    
    if (!room) {
      if (rooms.size >= MAX_ROOMS) {
        ws.close(1013, 'Server at capacity');
        return false;
      }
      room = {
        code: roomCode,
        participants: new Map(),
        createdAt: Date.now()
      };
      rooms.set(roomCode, room);
    }

    const existingParticipant = room.participants.get(oderId);
    if (existingParticipant) {
      existingParticipant.ws = ws;
      existingParticipant.lastPing = Date.now();
      
      const rejoinSignal: WebRTCSignal = {
        type: 'user-joined',
        roomCode,
        userId: oderId,
        data: {
          isHost: existingParticipant.isHost,
          participantCount: room.participants.size,
          existingParticipants: Array.from(room.participants.entries())
            .filter(([id]) => id !== oderId)
            .map(([id, p]) => ({ oderId: id, userName: p.userName }))
        }
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(rejoinSignal));
      }
      return true;
    }

    if (room.participants.size >= MAX_PARTICIPANTS_PER_ROOM) {
      ws.close(1013, 'Room at capacity');
      return false;
    }

    const isHost = room.participants.size === 0;

    const participant: ParticipantConnection = {
      oderId: oderId,
      userName,
      ws,
      isHost,
      hasWhiteboardAccess: isHost,
      lastPing: Date.now()
    };

    room.participants.set(oderId, participant);

    const joinedSignal: WebRTCSignal = {
      type: 'user-joined',
      roomCode,
      userId: oderId,
      data: {
        isHost,
        participantCount: room.participants.size,
        existingParticipants: Array.from(room.participants.entries())
          .filter(([id]) => id !== oderId)
          .map(([id, p]) => ({ oderId: id, userName: p.userName }))
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(joinedSignal));
    }

    const userJoinedBroadcast: WebRTCSignal = {
      type: 'user-joined',
      roomCode,
      userId: oderId,
      data: { 
        newUserId: oderId,
        userName,
        participantCount: room.participants.size
      }
    };
    
    room.participants.forEach((p, id) => {
      if (id !== oderId && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify(userJoinedBroadcast));
      }
    });

    return true;
  }

  function handleLeaveRoom(roomCode: string, oderId: string) {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.participants.delete(oderId);

    const userLeftSignal: WebRTCSignal = {
      type: 'user-left',
      roomCode,
      userId: oderId,
      data: { 
        leftUserId: oderId,
        participantCount: room.participants.size
      }
    };

    room.participants.forEach(p => {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify(userLeftSignal));
      }
    });

    if (room.participants.size === 0) {
      rooms.delete(roomCode);
    }
  }

  function relaySignalToTarget(roomCode: string, senderId: string, signal: WebRTCSignal) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const targetPeerId = signal.data?.targetPeerId;
    
    if (targetPeerId) {
      const targetParticipant = room.participants.get(targetPeerId);
      if (targetParticipant && targetParticipant.ws.readyState === WebSocket.OPEN) {
        targetParticipant.ws.send(JSON.stringify(signal));
      }
    } else {
      room.participants.forEach((p, id) => {
        if (id !== senderId && p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(JSON.stringify(signal));
        }
      });
    }
  }

  function broadcastToRoom(roomCode: string, senderId: string, signal: WebRTCSignal) {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.participants.forEach((p, id) => {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify(signal));
      }
    });
  }

  function handleWhiteboardAccessRequest(roomCode: string, oderId: string, signal: WebRTCSignal) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const host = Array.from(room.participants.values()).find(p => p.isHost);
    if (host && host.ws.readyState === WebSocket.OPEN) {
      host.ws.send(JSON.stringify(signal));
    }
  }

  function handleWhiteboardAccessResponse(roomCode: string, signal: WebRTCSignal) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const { targetUserId, approved } = signal.data;
    const targetParticipant = room.participants.get(targetUserId);
    
    if (targetParticipant) {
      if (approved) {
        targetParticipant.hasWhiteboardAccess = true;
      }
      
      if (targetParticipant.ws.readyState === WebSocket.OPEN) {
        targetParticipant.ws.send(JSON.stringify(signal));
      }
    }
  }

  setInterval(() => {
    const now = Date.now();
    
    rooms.forEach((room, roomCode) => {
      const staleParticipants: string[] = [];
      
      room.participants.forEach((participant, oderId) => {
        if (now - participant.lastPing > CONNECTION_TIMEOUT) {
          staleParticipants.push(oderId);
        }
      });
      
      staleParticipants.forEach(oderId => {
        handleLeaveRoom(roomCode, oderId);
      });
    });
  }, 10000);

  setInterval(() => {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;
    
    rooms.forEach((room, code) => {
      if (now - room.createdAt > maxAge && room.participants.size === 0) {
        rooms.delete(code);
      }
    });
  }, 60 * 60 * 1000);

  return httpServer;
}

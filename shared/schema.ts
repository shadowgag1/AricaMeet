import { z } from "zod";

export interface Participant {
  id: string;
  isHost: boolean;
  hasWhiteboardAccess: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  isPrivate?: boolean;
  recipientId?: string;
  recipientName?: string;
  isFile?: boolean;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileData?: ArrayBuffer;
  downloadedBy?: string[];
}

export interface FileTransfer {
  id: string;
  senderId: string;
  senderName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'paused';
  bytesTransferred?: number;
  speed?: number;
  chunks?: number;
  currentChunk?: number;
}

export interface AgendaItem {
  id: string;
  title: string;
  createdBy: string;
  createdByName: string;
  votes: string[];
  isCompleted: boolean;
  startedAt?: number;
  completedAt?: number;
  timeSpent?: number;
  order: number;
}

export interface HandRaise {
  id: string;
  userId: string;
  userName: string;
  topic?: string;
  raisedAt: number;
  acknowledged: boolean;
}

export interface SubChat {
  oderId: string;
  recipientId: string;
  recipientName: string;
  messages: ChatMessage[];
}

export interface WhiteboardEvent {
  type: 'draw' | 'erase' | 'undo' | 'clear';
  data: {
    x?: number;
    y?: number;
    prevX?: number;
    prevY?: number;
    color?: string;
    lineWidth?: number;
    strokeId?: string;
  };
  timestamp: number;
}

export type LayoutMode = 'grid' | 'presenter-whiteboard' | 'chat-whiteboard' | 'focus';

export type WebRTCSignalType = 
  | 'offer' 
  | 'answer' 
  | 'ice-candidate' 
  | 'join-room' 
  | 'user-joined'
  | 'user-left'
  | 'chat-message'
  | 'private-message'
  | 'file-transfer-offer'
  | 'file-transfer-chunk'
  | 'file-transfer-complete'
  | 'file-transfer-pause'
  | 'file-transfer-resume'
  | 'whiteboard-event'
  | 'request-whiteboard-access'
  | 'whiteboard-access-response'
  | 'typing-indicator'
  | 'agenda-add'
  | 'agenda-vote'
  | 'agenda-complete'
  | 'agenda-reorder'
  | 'agenda-sync'
  | 'hand-raise'
  | 'hand-lower'
  | 'hand-acknowledge'
  | 'hand-sync'
  | 'ping'
  | 'pong';

export interface WebRTCSignal {
  type: WebRTCSignalType;
  roomCode: string;
  userId: string;
  data?: any;
}

export const meetingCodeSchema = z.string()
  .min(6, "Meeting code must be at least 6 characters")
  .max(20, "Meeting code must be at most 20 characters")
  .regex(/^[A-Za-z0-9]+$/, "Meeting code must contain only letters and numbers");

export const agendaItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  createdBy: z.string(),
  createdByName: z.string(),
  votes: z.array(z.string()),
  isCompleted: z.boolean(),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  timeSpent: z.number().optional(),
  order: z.number()
});

export const handRaiseSchema = z.object({
  id: z.string(),
  oderId: z.string(),
  userName: z.string(),
  topic: z.string().max(100).optional(),
  raisedAt: z.number(),
  acknowledged: z.boolean()
});

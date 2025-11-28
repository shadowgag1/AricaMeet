import { useState, useEffect, useRef, useCallback } from "react";
import type { WebRTCSignal, ChatMessage, FileTransfer, WhiteboardEvent } from "@shared/schema";

interface UseWebRTCProps {
  roomCode: string;
  userId: string;
  userName: string;
  localStream: MediaStream | null;
  whiteboardHistory: WhiteboardEvent[];
  onRemoteStreamAdded: (peerId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (peerId: string) => void;
  onChatMessage: (message: ChatMessage) => void;
  onFileTransferOffer: (transfer: FileTransfer) => void;
  onFileTransferChunk: (data: any) => void;
  onFileTransferComplete: (transferId: string) => void;
  onWhiteboardEvent: (event: WhiteboardEvent) => void;
  onWhiteboardHistorySync: (events: WhiteboardEvent[]) => void;
  onWhiteboardAccessRequest: (data: { userId: string; userName: string }) => void;
  onWhiteboardAccessResponse: (data: { approved: boolean }) => void;
  onIsHostChange: (isHost: boolean) => void;
  onParticipantCountChange: (count: number) => void;
  onParticipantNameUpdate: (peerId: string, name: string) => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ]
};

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const HEARTBEAT_INTERVAL = 5000;

interface PeerState {
  pc: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[];
  hasRemoteDescription: boolean;
  connectionAttempts: number;
}

export function useWebRTC({
  roomCode,
  userId,
  userName,
  localStream,
  whiteboardHistory,
  onRemoteStreamAdded,
  onRemoteStreamRemoved,
  onChatMessage,
  onFileTransferOffer,
  onFileTransferChunk,
  onFileTransferComplete,
  onWhiteboardEvent,
  onWhiteboardHistorySync,
  onWhiteboardAccessRequest,
  onWhiteboardAccessResponse,
  onIsHostChange,
  onParticipantCountChange,
  onParticipantNameUpdate,
}: UseWebRTCProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, PeerState>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
  const pendingCandidatesMapRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCleaningUpRef = useRef(false);

  const sendSignal = useCallback((signal: Omit<WebRTCSignal, 'roomCode' | 'userId'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const fullSignal: WebRTCSignal = {
        ...signal,
        roomCode,
        userId,
      };
      wsRef.current.send(JSON.stringify(fullSignal));
    }
  }, [roomCode, userId]);

  const whiteboardHistoryRef = useRef<WhiteboardEvent[]>([]);
  const userNameRef = useRef(userName);
  
  useEffect(() => {
    whiteboardHistoryRef.current = whiteboardHistory;
  }, [whiteboardHistory]);

  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  const setupDataChannel = useCallback((channel: RTCDataChannel, peerId: string) => {
    channel.onopen = () => {
      channel.send(JSON.stringify({
        type: 'peer-info',
        name: userNameRef.current,
        oderId: userId
      }));

      if (whiteboardHistoryRef.current.length > 0) {
        channel.send(JSON.stringify({
          type: 'whiteboard-sync',
          events: whiteboardHistoryRef.current
        }));
      }
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'peer-info':
            if (data.name) {
              onParticipantNameUpdate(peerId, data.name);
            }
            break;
          case 'chat':
            onChatMessage(data.message);
            break;
          case 'file-offer':
            onFileTransferOffer(data.transfer);
            break;
          case 'file-chunk':
            onFileTransferChunk(data);
            break;
          case 'file-complete':
            onFileTransferComplete(data.transferId);
            break;
          case 'whiteboard':
            onWhiteboardEvent(data.event);
            break;
          case 'whiteboard-sync':
            if (data.events && Array.isArray(data.events)) {
              onWhiteboardHistorySync(data.events);
            }
            break;
        }
      } catch (error) {
      }
    };

    channel.onerror = () => {
    };

    channel.onclose = () => {
    };
  }, [userId, onChatMessage, onFileTransferOffer, onFileTransferChunk, onFileTransferComplete, onWhiteboardEvent, onWhiteboardHistorySync, onParticipantNameUpdate]);

  const cleanupPeer = useCallback((peerId: string) => {
    const peerState = peersRef.current.get(peerId);
    if (peerState) {
      peerState.pc.close();
      peersRef.current.delete(peerId);
    }
    dataChannelsRef.current.delete(peerId);
    onRemoteStreamRemoved(peerId);
  }, [onRemoteStreamRemoved]);

  const addPendingCandidates = useCallback(async (peerId: string) => {
    const peerState = peersRef.current.get(peerId);
    if (!peerState || !peerState.hasRemoteDescription) return;

    for (const candidate of peerState.pendingCandidates) {
      try {
        await peerState.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
      }
    }
    peerState.pendingCandidates = [];
  }, []);

  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean) => {
    const existingPeer = peersRef.current.get(peerId);
    if (existingPeer) {
      existingPeer.pc.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    const earlyCandidates = pendingCandidatesMapRef.current.get(peerId) || [];
    pendingCandidatesMapRef.current.delete(peerId);

    const peerState: PeerState = {
      pc,
      pendingCandidates: earlyCandidates,
      hasRemoteDescription: false,
      connectionAttempts: 0
    };

    peersRef.current.set(peerId, peerState);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice-candidate',
          data: {
            candidate: event.candidate.toJSON(),
            targetPeerId: peerId
          }
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteStreamAdded(peerId, event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      
      if (state === 'connected' || state === 'completed') {
        peerState.connectionAttempts = 0;
      } else if (state === 'failed') {
        if (peerState.connectionAttempts < 3) {
          peerState.connectionAttempts++;
          pc.restartIce();
        } else {
          cleanupPeer(peerId);
        }
      } else if (state === 'disconnected') {
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            cleanupPeer(peerId);
          }
        }, 5000);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        cleanupPeer(peerId);
      }
    };

    if (isInitiator) {
      const dataChannel = pc.createDataChannel('data', { ordered: true });
      setupDataChannel(dataChannel, peerId);
      dataChannelsRef.current.set(peerId, dataChannel);
    }

    pc.ondatachannel = (event) => {
      setupDataChannel(event.channel, peerId);
      dataChannelsRef.current.set(peerId, event.channel);
    };

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          sendSignal({
            type: 'offer',
            data: {
              offer: pc.localDescription,
              targetPeerId: peerId
            }
          });
        })
        .catch(() => {});
    }

    return pc;
  }, [localStream, sendSignal, onRemoteStreamAdded, cleanupPeer, setupDataChannel]);

  const connectWebSocket = useCallback(() => {
    if (isCleaningUpRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
      
      const joinSignal: WebRTCSignal = {
        type: 'join-room',
        roomCode,
        userId,
        data: { userName: userNameRef.current }
      };
      ws.send(JSON.stringify(joinSignal));

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', roomCode, userId, data: {} }));
        }
      }, HEARTBEAT_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const signal: WebRTCSignal = JSON.parse(event.data);

        switch (signal.type) {
          case 'pong':
            break;

          case 'user-joined':
            if (signal.data.isHost !== undefined) {
              setIsHost(signal.data.isHost);
              onIsHostChange(signal.data.isHost);
              onParticipantCountChange(signal.data.participantCount || 1);

              if (signal.data.existingParticipants) {
                signal.data.existingParticipants.forEach((participant: { oderId: string; userName: string }) => {
                  const peerId = typeof participant === 'string' ? participant : participant.oderId;
                  const peerName = typeof participant === 'string' ? undefined : participant.userName;
                  
                  if (peerName) {
                    onParticipantNameUpdate(peerId, peerName);
                  }
                  
                  createPeerConnection(peerId, true);
                });
              }
            } else if (signal.data.newUserId && signal.data.newUserId !== userId) {
              if (signal.data.userName) {
                onParticipantNameUpdate(signal.data.newUserId, signal.data.userName);
              }
              onParticipantCountChange(signal.data.participantCount || 1);
              createPeerConnection(signal.data.newUserId, false);
            }
            break;

          case 'user-left':
            const leftUserId = signal.data.leftUserId;
            if (leftUserId && leftUserId !== userId) {
              cleanupPeer(leftUserId);
              onParticipantCountChange(signal.data.participantCount || 1);
            }
            break;

          case 'offer':
            const offerPeerId = signal.userId;
            if (offerPeerId === userId) break;
            
            let offerPc = peersRef.current.get(offerPeerId)?.pc;
            if (!offerPc) {
              offerPc = createPeerConnection(offerPeerId, false);
            }
            
            const offerPeerState = peersRef.current.get(offerPeerId);
            if (offerPeerState) {
              offerPc.setRemoteDescription(new RTCSessionDescription(signal.data.offer))
                .then(() => {
                  offerPeerState.hasRemoteDescription = true;
                  return addPendingCandidates(offerPeerId);
                })
                .then(() => offerPc!.createAnswer())
                .then(answer => offerPc!.setLocalDescription(answer))
                .then(() => {
                  sendSignal({
                    type: 'answer',
                    data: {
                      answer: offerPc!.localDescription,
                      targetPeerId: offerPeerId
                    }
                  });
                })
                .catch(() => {});
            }
            break;

          case 'answer':
            const answerPeerId = signal.userId;
            if (answerPeerId === userId) break;
            
            const answerPeerState = peersRef.current.get(answerPeerId);
            if (answerPeerState) {
              answerPeerState.pc.setRemoteDescription(new RTCSessionDescription(signal.data.answer))
                .then(() => {
                  answerPeerState.hasRemoteDescription = true;
                  return addPendingCandidates(answerPeerId);
                })
                .catch(() => {});
            }
            break;

          case 'ice-candidate':
            const icePeerId = signal.userId;
            if (icePeerId === userId) break;
            
            if (signal.data.candidate) {
              const icePeerState = peersRef.current.get(icePeerId);
              if (icePeerState) {
                if (icePeerState.hasRemoteDescription) {
                  icePeerState.pc.addIceCandidate(new RTCIceCandidate(signal.data.candidate))
                    .catch(() => {});
                } else {
                  icePeerState.pendingCandidates.push(signal.data.candidate);
                }
              } else {
                const existing = pendingCandidatesMapRef.current.get(icePeerId) || [];
                existing.push(signal.data.candidate);
                pendingCandidatesMapRef.current.set(icePeerId, existing);
              }
            }
            break;

          case 'request-whiteboard-access':
            onWhiteboardAccessRequest({
              userId: signal.userId,
              userName: signal.data.userName
            });
            break;

          case 'whiteboard-access-response':
            onWhiteboardAccessResponse({
              approved: signal.data.approved
            });
            break;
        }
      } catch (error) {
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      if (!isCleaningUpRef.current && reconnectAttemptRef.current < RECONNECT_DELAYS.length) {
        const delay = RECONNECT_DELAYS[reconnectAttemptRef.current];
        reconnectAttemptRef.current++;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      }
    };
  }, [roomCode, userId, createPeerConnection, sendSignal, cleanupPeer, addPendingCandidates, onIsHostChange, onParticipantCountChange, onParticipantNameUpdate, onWhiteboardAccessRequest, onWhiteboardAccessResponse]);

  useEffect(() => {
    isCleaningUpRef.current = false;
    connectWebSocket();

    return () => {
      isCleaningUpRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      peersRef.current.forEach(peerState => peerState.pc.close());
      peersRef.current.clear();
      dataChannelsRef.current.clear();
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (localStream) {
      peersRef.current.forEach(peerState => {
        const senders = peerState.pc.getSenders();
        localStream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch(() => {});
          } else {
            peerState.pc.addTrack(track, localStream);
          }
        });
      });
    }
  }, [localStream]);

  const sendChatMessage = useCallback((message: ChatMessage) => {
    dataChannelsRef.current.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify({
          type: 'chat',
          message
        }));
      }
    });
  }, []);

  const sendWhiteboardEvent = useCallback((event: WhiteboardEvent) => {
    dataChannelsRef.current.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify({
          type: 'whiteboard',
          event
        }));
      }
    });
  }, []);

  const sendFileChunk = useCallback((transferId: string, chunk: ArrayBuffer, chunkIndex: number) => {
    dataChannelsRef.current.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify({
          type: 'file-chunk',
          transferId,
          chunk: Array.from(new Uint8Array(chunk)),
          chunkIndex
        }));
      }
    });
  }, []);

  const requestWhiteboardAccess = useCallback(() => {
    sendSignal({
      type: 'request-whiteboard-access',
      data: { userName: userNameRef.current }
    });
  }, [sendSignal]);

  const respondToWhiteboardRequest = useCallback((targetUserId: string, approved: boolean) => {
    sendSignal({
      type: 'whiteboard-access-response',
      data: { targetUserId, approved }
    });
  }, [sendSignal]);

  return {
    isConnected,
    isHost,
    sendChatMessage,
    sendWhiteboardEvent,
    sendFileChunk,
    requestWhiteboardAccess,
    respondToWhiteboardRequest,
  };
}

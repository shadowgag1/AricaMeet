import { useState, useEffect, useCallback, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { VideoTile } from "@/components/video-tile";
import { ControlBar } from "@/components/control-bar";
import { ChatPanel } from "@/components/chat-panel";
import { Whiteboard } from "@/components/whiteboard";
import { FileTransferModal } from "@/components/file-transfer-modal";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { PermissionModal } from "@/components/permission-modal";
import { ParticipantsPanel } from "@/components/participants-panel";
import { SecurityConsole } from "@/components/security-console";
import { NetworkTopology } from "@/components/network-topology";
import { SecurityScan } from "@/components/security-scan";
import { EncryptionBadge } from "@/components/encryption-badge";
import { SecurityStats } from "@/components/security-stats";
import { KeyboardShortcuts, useKeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { AgendaPanel } from "@/components/agenda-panel";
import { HandRaiseQueue } from "@/components/hand-raise-queue";
import { PrivateChat } from "@/components/private-chat";
import { LargeFileTransfer } from "@/components/large-file-transfer";
import { Button } from "@/components/ui/button";
import { Copy, Check, Shield, Terminal, Wifi, Lock, Keyboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebRTC } from "@/hooks/use-webrtc";
import type { ChatMessage, FileTransfer, WhiteboardEvent, AgendaItem, HandRaise } from "@shared/schema";

function getUserId(): string {
  let storedId = sessionStorage.getItem('meetUserId');
  if (!storedId) {
    storedId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
    sessionStorage.setItem('meetUserId', storedId);
  }
  return storedId;
}

function getUserName(): string {
  return sessionStorage.getItem('meetUserName') || 'You';
}

export default function MeetingRoom() {
  const [match, params] = useRoute("/meeting/:code");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isTopologyOpen, setIsTopologyOpen] = useState(false);
  const [isEncryptionOpen, setIsEncryptionOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [sessionStartTime] = useState(Date.now());
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [currentFileTransfer, setCurrentFileTransfer] = useState<FileTransfer | null>(null);
  const [isFileTransferModalOpen, setIsFileTransferModalOpen] = useState(false);
  const [permissionRequest, setPermissionRequest] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [hasWhiteboardAccess, setHasWhiteboardAccess] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [whiteboardHistory, setWhiteboardHistory] = useState<WhiteboardEvent[]>([]);

  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isHandRaiseQueueOpen, setIsHandRaiseQueueOpen] = useState(false);
  const [handRaiseQueue, setHandRaiseQueue] = useState<HandRaise[]>([]);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);
  const [privateMessages, setPrivateMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [fileTransfers, setFileTransfers] = useState<FileTransfer[]>([]);
  const [isLargeFileTransferOpen, setIsLargeFileTransferOpen] = useState(false);

  const meetingCode = params?.code || "";
  const userId = useMemo(() => getUserId(), []);
  const userName = useMemo(() => getUserName(), []);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, string>>(new Map());

  const handleRemoteStreamAdded = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.set(peerId, stream);
      return newMap;
    });
  }, []);

  const handleRemoteStreamRemoved = useCallback((peerId: string) => {
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(peerId);
      return newMap;
    });
    setRemoteParticipants(prev => {
      const newMap = new Map(prev);
      newMap.delete(peerId);
      return newMap;
    });
  }, []);

  const handleChatMessage = useCallback((message: ChatMessage) => {
    if (message.content.startsWith('[DOWNLOAD_CONFIRMED:')) {
      const messageId = message.content.replace('[DOWNLOAD_CONFIRMED:', '').replace(']', '');
      setChatMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.senderId === userId) {
          const downloaded = msg.downloadedBy || [];
          if (!downloaded.includes(message.senderId)) {
            return { ...msg, downloadedBy: [...downloaded, message.senderId] };
          }
        }
        return msg;
      }));
      return;
    }

    if (message.isPrivate) {
      const key = [userId, message.senderId].sort().join('-');
      setPrivateMessages(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(key) || [];
        newMap.set(key, [...existing, message]);
        return newMap;
      });
    } else {
      if (message.isFile && message.fileData && Array.isArray(message.fileData)) {
        message.fileData = new Uint8Array(message.fileData as unknown as number[]).buffer;
      }
      setChatMessages(prev => [...prev, message]);
    }
  }, [userId]);

  const handleWhiteboardEvent = useCallback((event: WhiteboardEvent) => {
    setWhiteboardHistory(prev => [...prev, event]);
  }, []);

  const handleWhiteboardAccessRequest = useCallback((data: { userId: string; userName: string }) => {
    setPermissionRequest(data);
  }, []);

  const handleWhiteboardAccessResponse = useCallback((data: { approved: boolean }) => {
    if (data.approved) {
      setHasWhiteboardAccess(true);
      toast({
        title: "Access granted",
        description: "You can now edit the whiteboard",
      });
    } else {
      toast({
        title: "Access denied",
        description: "Your edit request was denied",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleParticipantNameUpdate = useCallback((peerId: string, name: string) => {
    setRemoteParticipants(prev => {
      const newMap = new Map(prev);
      newMap.set(peerId, name);
      return newMap;
    });
  }, []);

  const {
    isConnected,
    isHost: webrtcIsHost,
    sendChatMessage,
    sendWhiteboardEvent,
    requestWhiteboardAccess,
    respondToWhiteboardRequest,
  } = useWebRTC({
    roomCode: meetingCode,
    userId,
    userName,
    localStream,
    whiteboardHistory,
    onRemoteStreamAdded: handleRemoteStreamAdded,
    onRemoteStreamRemoved: handleRemoteStreamRemoved,
    onChatMessage: handleChatMessage,
    onFileTransferOffer: () => {},
    onFileTransferChunk: () => {},
    onFileTransferComplete: () => {},
    onWhiteboardEvent: handleWhiteboardEvent,
    onWhiteboardHistorySync: (events) => {
      setWhiteboardHistory(prev => prev.length === 0 ? events : prev);
    },
    onWhiteboardAccessRequest: handleWhiteboardAccessRequest,
    onWhiteboardAccessResponse: handleWhiteboardAccessResponse,
    onIsHostChange: setIsHost,
    onParticipantCountChange: setParticipantCount,
    onParticipantNameUpdate: handleParticipantNameUpdate,
  });

  useEffect(() => {
    setIsHost(webrtcIsHost);
    if (webrtcIsHost) {
      setHasWhiteboardAccess(true);
    }
  }, [webrtcIsHost]);

  useEffect(() => {
    initializeMedia();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      remoteStreams.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
    } catch (error) {
      toast({
        title: "Camera/Microphone Error",
        description: "Could not access your camera or microphone",
        variant: "destructive",
      });
    }
  };

  const handleToggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const handleToggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      await initializeMedia();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          initializeMedia();
        };

        setLocalStream(screenStream);
        setIsScreenSharing(true);
      } catch (error) {
        toast({
          title: "Screen Share Error",
          description: "Could not start screen sharing",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendMessage = (content: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: userId,
      senderName: "You",
      content,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, message]);
    sendChatMessage(message);
  };

  const handleSendFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target?.result as ArrayBuffer;
      const message: ChatMessage = {
        id: `file-${Date.now()}-${Math.random()}`,
        senderId: userId,
        senderName: "You",
        content: `[FILE] ${file.name}`,
        timestamp: Date.now(),
        isFile: true,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: fileData,
        downloadedBy: []
      };
      setChatMessages(prev => [...prev, message]);
      sendChatMessage({
        ...message,
        fileData: Array.from(new Uint8Array(fileData)) as unknown as ArrayBuffer
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadFile = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.isFile && msg.fileData) {
        const downloaded = msg.downloadedBy || [];
        if (!downloaded.includes(userId)) {
          let arrayBuffer: ArrayBuffer;
          if (Array.isArray(msg.fileData)) {
            arrayBuffer = new Uint8Array(msg.fileData as unknown as number[]).buffer;
          } else {
            arrayBuffer = msg.fileData;
          }
          
          const blob = new Blob([arrayBuffer], { type: msg.fileType || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = msg.fileName || 'download';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          return { ...msg, downloadedBy: [...downloaded, userId] };
        }
      }
      return msg;
    }));

    sendChatMessage({
      id: `dl-${Date.now()}`,
      senderId: userId,
      senderName: userName,
      content: `[DOWNLOAD_CONFIRMED:${messageId}]`,
      timestamp: Date.now()
    });
  };

  const handleSendPrivateMessage = (recipientId: string, recipientName: string, content: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: userId,
      senderName: userName,
      content,
      timestamp: Date.now(),
      isPrivate: true,
      recipientId,
      recipientName
    };
    
    const key = [userId, recipientId].sort().join('-');
    setPrivateMessages(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(key) || [];
      newMap.set(key, [...existing, message]);
      return newMap;
    });
    
    sendChatMessage(message);
  };

  const handleSelectFile = (file: File) => {
    const transfer: FileTransfer = {
      id: `transfer-${Date.now()}`,
      senderId: userId,
      senderName: "You",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 0,
      status: 'transferring'
    };
    
    setFileTransfers(prev => [...prev, transfer]);
    setCurrentFileTransfer(transfer);
    setIsFileTransferModalOpen(true);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setCurrentFileTransfer(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);
        setFileTransfers(prev => prev.map(t => 
          t.id === transfer.id ? { ...t, progress: 100, status: 'completed' as const } : t
        ));
      } else {
        setCurrentFileTransfer(prev => prev ? { ...prev, progress } : null);
        setFileTransfers(prev => prev.map(t => 
          t.id === transfer.id ? { ...t, progress } : t
        ));
      }
    }, 300);
  };

  const handleAddAgendaItem = (title: string) => {
    const item: AgendaItem = {
      id: `agenda-${Date.now()}`,
      title,
      createdBy: userId,
      createdByName: userName,
      votes: [userId],
      isCompleted: false,
      order: agendaItems.length,
      startedAt: agendaItems.length === 0 ? Date.now() : undefined
    };
    setAgendaItems(prev => [...prev, item]);
  };

  const handleVoteAgendaItem = (itemId: string) => {
    setAgendaItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const hasVoted = item.votes.includes(userId);
        return {
          ...item,
          votes: hasVoted 
            ? item.votes.filter(v => v !== userId)
            : [...item.votes, userId]
        };
      }
      return item;
    }));
  };

  const handleCompleteAgendaItem = (itemId: string) => {
    setAgendaItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const timeSpent = item.startedAt ? Math.floor((Date.now() - item.startedAt) / 1000) : 0;
          return { ...item, isCompleted: true, completedAt: Date.now(), timeSpent };
        }
        return item;
      });
      
      const nextItem = updated.find(item => !item.isCompleted && !item.startedAt);
      if (nextItem) {
        return updated.map(item => 
          item.id === nextItem.id ? { ...item, startedAt: Date.now() } : item
        );
      }
      return updated;
    });
  };

  const handleRaiseHand = (topic?: string) => {
    const raise: HandRaise = {
      id: `hand-${Date.now()}`,
      userId,
      userName,
      topic,
      raisedAt: Date.now(),
      acknowledged: false
    };
    setHandRaiseQueue(prev => [...prev, raise]);
    setHasRaisedHand(true);
  };

  const handleLowerHand = () => {
    setHandRaiseQueue(prev => prev.filter(h => h.userId !== userId));
    setHasRaisedHand(false);
  };

  const handleAcknowledgeHand = (id: string) => {
    setHandRaiseQueue(prev => prev.map(h => 
      h.id === id ? { ...h, acknowledged: true } : h
    ));
  };

  const handleWhiteboardDraw = (data: any) => {
    const event: WhiteboardEvent = {
      type: 'draw',
      data,
      timestamp: Date.now()
    };
    setWhiteboardHistory(prev => [...prev, event]);
    sendWhiteboardEvent(event);
  };

  const handleWhiteboardErase = (data: any) => {
    const event: WhiteboardEvent = {
      type: 'erase',
      data,
      timestamp: Date.now()
    };
    setWhiteboardHistory(prev => [...prev, event]);
    sendWhiteboardEvent(event);
  };

  const handleWhiteboardUndo = () => {
    const event: WhiteboardEvent = {
      type: 'undo',
      data: {},
      timestamp: Date.now()
    };
    setWhiteboardHistory(prev => [...prev, event]);
    sendWhiteboardEvent(event);
  };

  const handleWhiteboardClear = () => {
    const event: WhiteboardEvent = {
      type: 'clear',
      data: {},
      timestamp: Date.now()
    };
    setWhiteboardHistory([]);
    sendWhiteboardEvent(event);
  };

  const handleRequestWhiteboardAccess = () => {
    requestWhiteboardAccess();
    toast({
      title: "Request sent",
      description: "Waiting for host approval...",
    });
  };

  const handleApproveAccess = () => {
    if (permissionRequest) {
      respondToWhiteboardRequest(permissionRequest.userId, true);
      setPermissionRequest(null);
      toast({
        title: "Access granted",
        description: `${permissionRequest.userName} can now edit the whiteboard`,
      });
    }
  };

  const handleDenyAccess = () => {
    if (permissionRequest) {
      respondToWhiteboardRequest(permissionRequest.userId, false);
      setPermissionRequest(null);
    }
  };

  const handleLeave = () => {
    localStream?.getTracks().forEach(track => track.stop());
    remoteStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    setLocation("/");
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(meetingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast({
      title: "Copied",
      description: "Meeting code copied to clipboard",
    });
  };

  const handleScanComplete = () => {
    setIsScanning(false);
  };

  useKeyboardShortcuts({
    onToggleMic: handleToggleMic,
    onToggleCamera: handleToggleCamera,
    onToggleScreenShare: handleToggleScreenShare,
    onToggleParticipants: () => setIsParticipantsOpen(!isParticipantsOpen),
    onToggleChat: () => setIsChatOpen(!isChatOpen),
    onToggleWhiteboard: () => setIsWhiteboardOpen(!isWhiteboardOpen),
    onToggleConsole: () => setIsConsoleOpen(!isConsoleOpen),
    onToggleTopology: () => setIsTopologyOpen(!isTopologyOpen),
    onToggleShortcuts: () => setIsShortcutsOpen(!isShortcutsOpen),
    onLeave: handleLeave,
  });

  if (!match) {
    return null;
  }

  const allParticipants = [
    { id: userId, name: userName, isLocal: true },
    ...Array.from(remoteStreams.keys()).map(id => ({
      id,
      name: remoteParticipants.get(id) || 'Guest',
      isLocal: false
    }))
  ];

  const totalParticipants = 1 + remoteStreams.size;
  const gridCols = totalParticipants <= 1 ? 1 : totalParticipants <= 4 ? 2 : totalParticipants <= 9 ? 3 : 4;

  return (
    <div className="h-screen w-screen bg-[#0a0e1a] flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,217,255,0.03)_0%,_transparent_50%)]" />
      
      <div className="relative flex items-center justify-between px-5 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-white text-sm font-medium space-grotesk">AricaMeet</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-sm">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-cyan-400/80 text-sm jetbrains-mono bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/50">{meetingCode}</span>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium">Host</span>
            </div>
          )}
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEncryptionOpen(true)}
            className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
            data-testid="button-encryption"
            title="Encryption Status"
          >
            <Lock className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg"
            data-testid="button-console"
            title="Security Console"
          >
            <Terminal className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsTopologyOpen(true)}
            className="h-8 w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg"
            data-testid="button-topology"
            title="Network Topology"
          >
            <Wifi className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsShortcutsOpen(true)}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg"
            data-testid="button-shortcuts"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyCode}
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 gap-2 rounded-lg"
            data-testid="button-copy-code"
          >
            {copiedCode ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="text-sm">Copy</span>
          </Button>
        </div>
      </div>

      <SecurityStats isVisible={showStats && !isScanning} startTime={sessionStartTime} />

      <div className="relative flex-1 p-4 overflow-hidden">
        <div 
          className={`h-full grid gap-3 auto-rows-fr`}
          style={{ 
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            maxWidth: totalParticipants === 1 ? '900px' : '100%',
            margin: totalParticipants === 1 ? '0 auto' : '0'
          }}
        >
          <VideoTile
            stream={localStream}
            isLocal={true}
            isMuted={!isMicOn}
            participantName={userName}
          />

          {Array.from(remoteStreams.entries()).map(([id, stream]) => (
            <VideoTile
              key={id}
              stream={stream}
              isMuted={false}
              participantName={remoteParticipants.get(id) || `Guest`}
            />
          ))}
        </div>
      </div>

      <ControlBar
        isCameraOn={isCameraOn}
        isMicOn={isMicOn}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        isWhiteboardOpen={isWhiteboardOpen}
        isParticipantsOpen={isParticipantsOpen}
        isAgendaOpen={isAgendaOpen}
        isHandRaised={hasRaisedHand}
        isPrivateChatOpen={isPrivateChatOpen}
        participantCount={participantCount}
        handRaiseCount={handRaiseQueue.length}
        onToggleCamera={handleToggleCamera}
        onToggleMic={handleToggleMic}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleChat={() => { setIsChatOpen(!isChatOpen); setIsPrivateChatOpen(false); }}
        onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        onToggleAgenda={() => setIsAgendaOpen(!isAgendaOpen)}
        onToggleHandRaise={() => setIsHandRaiseQueueOpen(!isHandRaiseQueueOpen)}
        onTogglePrivateChat={() => { setIsPrivateChatOpen(!isPrivateChatOpen); setIsChatOpen(false); }}
        onOpenFileShare={() => setIsLargeFileTransferOpen(true)}
        onLeave={handleLeave}
      />

      <ChatPanel
        isOpen={isChatOpen}
        messages={chatMessages}
        currentUserId={userId}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onDownloadFile={handleDownloadFile}
      />

      <PrivateChat
        isOpen={isPrivateChatOpen}
        participants={allParticipants}
        currentUserId={userId}
        currentUserName={userName}
        privateMessages={privateMessages}
        onClose={() => setIsPrivateChatOpen(false)}
        onSendPrivateMessage={handleSendPrivateMessage}
      />

      <AgendaPanel
        isOpen={isAgendaOpen}
        items={agendaItems}
        currentUserId={userId}
        currentUserName={userName}
        isHost={isHost}
        onClose={() => setIsAgendaOpen(false)}
        onAddItem={handleAddAgendaItem}
        onVoteItem={handleVoteAgendaItem}
        onCompleteItem={handleCompleteAgendaItem}
        onReorderItems={setAgendaItems}
      />

      <HandRaiseQueue
        isOpen={isHandRaiseQueueOpen}
        queue={handRaiseQueue}
        currentUserId={userId}
        currentUserName={userName}
        isHost={isHost}
        hasRaisedHand={hasRaisedHand}
        onClose={() => setIsHandRaiseQueueOpen(false)}
        onRaiseHand={handleRaiseHand}
        onLowerHand={handleLowerHand}
        onAcknowledge={handleAcknowledgeHand}
      />

      <ParticipantsPanel
        isOpen={isParticipantsOpen}
        participants={[
          {
            id: userId,
            name: userName,
            isHost: isHost,
            isMuted: !isMicOn,
            isCameraOff: !isCameraOn,
            isLocal: true
          },
          ...Array.from(remoteStreams.keys()).map(id => ({
            id,
            name: remoteParticipants.get(id) || 'Guest',
            isHost: false,
            isMuted: false,
            isCameraOff: false,
            isLocal: false
          }))
        ]}
        onClose={() => setIsParticipantsOpen(false)}
      />

      <Whiteboard
        isOpen={isWhiteboardOpen}
        isHost={isHost}
        hasAccess={hasWhiteboardAccess}
        events={whiteboardHistory}
        onClose={() => setIsWhiteboardOpen(false)}
        onRequestAccess={handleRequestWhiteboardAccess}
        onDraw={handleWhiteboardDraw}
        onErase={handleWhiteboardErase}
        onUndo={handleWhiteboardUndo}
        onClear={handleWhiteboardClear}
      />

      <LargeFileTransfer
        isOpen={isLargeFileTransferOpen}
        transfers={fileTransfers}
        currentUserId={userId}
        onClose={() => setIsLargeFileTransferOpen(false)}
        onSelectFile={handleSelectFile}
        onPauseTransfer={(id) => setFileTransfers(prev => prev.map(t => t.id === id ? {...t, status: 'paused'} : t))}
        onResumeTransfer={(id) => setFileTransfers(prev => prev.map(t => t.id === id ? {...t, status: 'transferring'} : t))}
        onCancelTransfer={(id) => setFileTransfers(prev => prev.filter(t => t.id !== id))}
      />

      <FileUploadDialog
        isOpen={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
        onSelectFile={handleSelectFile}
      />

      <FileTransferModal
        isOpen={isFileTransferModalOpen}
        transfer={currentFileTransfer}
        onClose={() => setIsFileTransferModalOpen(false)}
      />

      {permissionRequest && (
        <PermissionModal
          isOpen={true}
          requesterName={permissionRequest.userName}
          onApprove={handleApproveAccess}
          onDeny={handleDenyAccess}
        />
      )}

      <SecurityConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        roomCode={meetingCode}
        participantCount={participantCount}
        isConnected={isConnected}
      />

      <NetworkTopology
        isOpen={isTopologyOpen}
        onClose={() => setIsTopologyOpen(false)}
        peers={allParticipants}
        localUserId={userId}
      />

      <EncryptionBadge
        isOpen={isEncryptionOpen}
        onClose={() => setIsEncryptionOpen(false)}
        roomCode={meetingCode}
        participantCount={participantCount}
      />

      <KeyboardShortcuts
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <SecurityScan
        isScanning={isScanning}
        onComplete={handleScanComplete}
        roomCode={meetingCode}
      />
    </div>
  );
}

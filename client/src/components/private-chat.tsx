import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, Send, Lock, ChevronRight, User, 
  MessageSquareLock, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@shared/schema";

interface Participant {
  id: string;
  name: string;
  isLocal?: boolean;
}

interface PrivateChatProps {
  isOpen: boolean;
  participants: Participant[];
  currentUserId: string;
  currentUserName: string;
  privateMessages: Map<string, ChatMessage[]>;
  onClose: () => void;
  onSendPrivateMessage: (recipientId: string, recipientName: string, content: string) => void;
}

export function PrivateChat({
  isOpen,
  participants,
  currentUserId,
  currentUserName,
  privateMessages,
  onClose,
  onSendPrivateMessage
}: PrivateChatProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [messageText, setMessageText] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherParticipants = participants.filter(p => p.id !== currentUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [privateMessages, selectedParticipant]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedParticipant) return;
    onSendPrivateMessage(selectedParticipant.id, selectedParticipant.name, messageText.trim());
    setMessageText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getConversationKey = (oderId: string) => {
    return [currentUserId, oderId].sort().join('-');
  };

  const getUnreadCount = (participantId: string) => {
    const key = getConversationKey(participantId);
    const messages = privateMessages.get(key) || [];
    return messages.filter(m => m.senderId !== currentUserId).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] bg-[#0a0e14] border-l border-violet-900/30 shadow-2xl z-40 flex flex-col font-mono">
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.02]" 
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139,92,246,0.02) 1px, rgba(139,92,246,0.02) 2px)'
        }} 
      />

      <div className="flex items-center justify-between h-12 px-4 bg-[#0d1117] border-b border-violet-900/40">
        <div className="flex items-center gap-3">
          {selectedParticipant ? (
            <button
              onClick={() => setSelectedParticipant(null)}
              className="flex items-center gap-2 text-violet-400 hover:text-violet-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
          )}
          <div className="flex items-center gap-2 text-violet-400 text-xs">
            <MessageSquareLock className="h-3.5 w-3.5" />
            <span className="tracking-wider">
              {selectedParticipant ? `DM: ${selectedParticipant.name}` : 'PRIVATE_CHAT'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
            <Lock className="h-2.5 w-2.5" />
            <span>1:1</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            data-testid="button-close-private-chat"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!selectedParticipant ? (
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-2">
            <p className="text-[10px] text-slate-600 mb-3 tracking-widest">SELECT PARTICIPANT</p>
            
            {otherParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <User className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-xs tracking-widest">NO OTHER PARTICIPANTS</p>
                <p className="text-[10px] text-slate-700 mt-2">Private chat needs at least 2 people</p>
              </div>
            ) : (
              otherParticipants.map(participant => {
                const unread = getUnreadCount(participant.id);
                const key = getConversationKey(participant.id);
                const messages = privateMessages.get(key) || [];
                const lastMessage = messages[messages.length - 1];
                
                return (
                  <button
                    key={participant.id}
                    onClick={() => setSelectedParticipant(participant)}
                    className="w-full flex items-center gap-3 p-3 rounded border border-slate-700/30 bg-[#0d1117] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left group"
                    data-testid={`select-participant-${participant.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center border border-violet-500/20">
                      <User className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{participant.name}</span>
                        {unread > 0 && (
                          <span className="bg-violet-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {unread}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {lastMessage.senderId === currentUserId ? "You: " : ""}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      ) : (
        <>
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollAreaRef}>
            <div className="space-y-2">
              <div className="text-[10px] text-slate-600 mb-4 space-y-0.5 text-center">
                <p>[SYS] Private channel established</p>
                <p className="text-emerald-500">End-to-end encrypted • P2P only</p>
              </div>

              {(() => {
                const key = getConversationKey(selectedParticipant.id);
                const messages = privateMessages.get(key) || [];
                
                if (messages.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                      <Lock className="h-8 w-8 mb-3 opacity-30" />
                      <p className="text-[10px]">Start a private conversation</p>
                    </div>
                  );
                }

                return messages.map((message) => {
                  const isOwn = message.senderId === currentUserId;
                  
                  return (
                    <div
                      key={message.id}
                      className="group"
                      data-testid={`private-message-${message.id}`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-700 mb-0.5">
                        <span>[{formatTimestamp(message.timestamp)}]</span>
                        <span className={cn(
                          "font-semibold",
                          isOwn ? "text-violet-500" : "text-purple-400"
                        )}>
                          @{isOwn ? "you" : message.senderName.toLowerCase().replace(/\s+/g, '_')}
                        </span>
                      </div>
                      
                      <div className={cn(
                        "pl-4 text-sm leading-relaxed border-l-2 ml-1",
                        isOwn 
                          ? "border-violet-500/30 text-violet-100" 
                          : "border-purple-500/30 text-purple-100"
                      )}>
                        {message.content}
                      </div>
                    </div>
                  );
                });
              })()}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-violet-900/40 bg-[#0d1117]/80">
            <div className="flex items-center gap-2 bg-[#0a0e14] rounded border border-violet-900/30 px-3 py-2 focus-within:border-violet-500/50 focus-within:shadow-[0_0_10px_rgba(139,92,246,0.1)] transition-all">
              <ChevronRight className="h-4 w-4 text-violet-500 flex-shrink-0" />
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedParticipant.name}...`}
                className="flex-1 bg-transparent text-violet-100 text-sm placeholder:text-slate-600 focus:outline-none font-mono"
                data-testid="input-private-message"
                maxLength={500}
              />
              <Button
                onClick={handleSend}
                disabled={!messageText.trim()}
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-violet-500 hover:text-violet-300 hover:bg-violet-500/10 disabled:opacity-30"
                data-testid="button-send-private"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-center mt-2 text-[9px] text-slate-700">
              <Lock className="h-2.5 w-2.5 mr-1" />
              Messages are not stored on any server
            </div>
          </div>
        </>
      )}
    </div>
  );
}

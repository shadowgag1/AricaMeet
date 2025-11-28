import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Terminal, ChevronRight, Lock, Zap, Paperclip, FileText, Download, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@shared/schema";

interface ChatPanelProps {
  isOpen: boolean;
  messages: ChatMessage[];
  currentUserId: string;
  onClose: () => void;
  onSendMessage: (content: string) => void;
  onSendFile: (file: File) => void;
  onDownloadFile: (messageId: string) => void;
}

function TypingText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, isComplete]);

  return (
    <span>
      {displayedText}
      {!isComplete && <span className="animate-pulse text-cyan-400">▌</span>}
    </span>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function ChatPanel({
  isOpen,
  messages,
  currentUserId,
  onClose,
  onSendMessage,
  onSendFile,
  onDownloadFile
}: ChatPanelProps) {
  const [messageText, setMessageText] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const getHandle = (name: string) => {
    return `@${name.toLowerCase().replace(/\s+/g, '_')}`;
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    
    setCommandHistory(prev => [...prev, messageText]);
    setHistoryIndex(-1);
    onSendMessage(messageText);
    setMessageText("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    try {
      await onSendFile(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setMessageText(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setMessageText(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setMessageText("");
      }
    }
  };

  const canDownload = (message: ChatMessage) => {
    if (!message.isFile) return false;
    if (message.senderId === currentUserId) return false;
    if (message.downloadedBy?.includes(currentUserId)) return false;
    return true;
  };

  const hasDownloaded = (message: ChatMessage) => {
    return message.downloadedBy?.includes(currentUserId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-[#0a0e14] border-l border-cyan-900/30 shadow-2xl z-40 flex flex-col font-mono overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]" 
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,0,0.03) 1px, rgba(0,255,0,0.03) 2px)'
        }} 
      />
      
      <div className="flex items-center justify-between h-12 px-4 bg-[#0d1117] border-b border-cyan-900/40">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-400/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-400/50" />
          </div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs">
            <Terminal className="h-3.5 w-3.5" />
            <span className="tracking-wider">SECURE_CHANNEL</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <Lock className="h-2.5 w-2.5" />
            <span>E2E</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            data-testid="button-close-chat"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-2 bg-[#0d1117]/50 border-b border-cyan-900/20 text-[10px]">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Zap className="h-3 w-3" />
          <span>P2P ACTIVE</span>
        </div>
        <div className="text-slate-600">|</div>
        <div className="text-cyan-500/70">AES-256-GCM</div>
        <div className="text-slate-600">|</div>
        <div className="text-amber-400/70">1x DOWNLOAD</div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3" ref={scrollAreaRef}>
        <div className="space-y-1">
          <div className="text-[10px] text-slate-600 mb-4 space-y-0.5">
            <p>[SYS] Initializing secure channel...</p>
            <p>[SYS] Handshake complete. Session established.</p>
            <p>[SYS] <span className="text-emerald-500">Ready for transmission.</span></p>
            <p>[SYS] <span className="text-amber-500">Files: one-time download only</span></p>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600">
              <div className="text-6xl mb-4 opacity-20">{'>'}_</div>
              <p className="text-xs tracking-widest">AWAITING INPUT</p>
              <p className="text-[10px] text-slate-700 mt-2">Zero server storage • P2P only • Files vanish after download</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const isNew = index === messages.length - 1;
              
              return (
                <div
                  key={message.id}
                  className="group"
                  data-testid={`chat-message-${message.id}`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-700 mb-0.5">
                    <span>[{formatTimestamp(message.timestamp)}]</span>
                    <span className={cn(
                      "font-semibold",
                      isOwn ? "text-cyan-500" : "text-emerald-500"
                    )}>
                      {getHandle(isOwn ? "you" : message.senderName)}
                    </span>
                    {message.isFile && (
                      <span className="text-amber-400">📎</span>
                    )}
                    {isOwn && (
                      <span className="text-violet-400/50">{'>'}</span>
                    )}
                  </div>
                  
                  {message.isFile ? (
                    <div className={cn(
                      "pl-4 ml-1 border-l-2",
                      isOwn 
                        ? "border-cyan-500/30" 
                        : "border-emerald-500/30"
                    )}>
                      <div className={cn(
                        "inline-flex items-center gap-3 p-3 rounded-lg border",
                        isOwn
                          ? "bg-cyan-950/30 border-cyan-800/30"
                          : "bg-emerald-950/30 border-emerald-800/30"
                      )}>
                        <div className={cn(
                          "p-2 rounded",
                          isOwn ? "bg-cyan-500/20" : "bg-emerald-500/20"
                        )}>
                          <FileText className={cn(
                            "h-5 w-5",
                            isOwn ? "text-cyan-400" : "text-emerald-400"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate max-w-[180px]",
                            isOwn ? "text-cyan-200" : "text-emerald-200"
                          )}>
                            {message.fileName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {formatFileSize(message.fileSize || 0)}
                          </p>
                        </div>
                        {!isOwn && (
                          canDownload(message) ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onDownloadFile(message.id)}
                              className="h-8 w-8 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                              data-testid={`button-download-${message.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : hasDownloaded(message) ? (
                            <div className="h-8 w-8 rounded bg-slate-700/30 flex items-center justify-center">
                              <Check className="h-4 w-4 text-slate-500" />
                            </div>
                          ) : null
                        )}
                        {isOwn && (
                          <div className="text-[9px] text-slate-600 text-right">
                            <p>SENT</p>
                            {message.downloadedBy && message.downloadedBy.length > 0 && (
                              <p className="text-emerald-500">{message.downloadedBy.length} DL</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "pl-4 text-sm leading-relaxed border-l-2 ml-1",
                      isOwn 
                        ? "border-cyan-500/30 text-cyan-100" 
                        : "border-emerald-500/30 text-emerald-100"
                    )}>
                      {isNew && !isOwn ? (
                        <TypingText text={message.content} speed={15} />
                      ) : (
                        message.content
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-cyan-900/40 bg-[#0d1117]/80">
        <div className="flex items-center gap-2 bg-[#0a0e14] rounded border border-cyan-900/30 px-3 py-2 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_10px_rgba(0,217,255,0.1)] transition-all">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file-upload"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-7 w-7 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 flex-shrink-0"
            data-testid="button-attach-file"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Paperclip className="h-3.5 w-3.5" />
            )}
          </Button>
          <div className="w-px h-4 bg-slate-700" />
          <ChevronRight className="h-4 w-4 text-cyan-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter message..."
            className="flex-1 bg-transparent text-cyan-100 text-sm placeholder:text-slate-600 focus:outline-none font-mono"
            data-testid="input-chat-message"
            maxLength={500}
            autoComplete="off"
            spellCheck={false}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim()}
            size="icon"
            variant="ghost"
            data-testid="button-send-message"
            className="h-7 w-7 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[9px] text-slate-700 px-1">
          <span>📎 attach • ↑↓ history • ENTER send</span>
          <span className="text-amber-500/50">max 100MB</span>
        </div>
      </div>
    </div>
  );
}

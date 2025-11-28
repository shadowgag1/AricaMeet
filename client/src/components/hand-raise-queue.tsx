import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, Hand, Check, MessageSquare, Clock, 
  ChevronRight, Users, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HandRaise } from "@shared/schema";

interface HandRaiseQueueProps {
  isOpen: boolean;
  queue: HandRaise[];
  currentUserId: string;
  currentUserName: string;
  isHost: boolean;
  hasRaisedHand: boolean;
  onClose: () => void;
  onRaiseHand: (topic?: string) => void;
  onLowerHand: () => void;
  onAcknowledge: (id: string) => void;
}

export function HandRaiseQueue({
  isOpen,
  queue,
  currentUserId,
  currentUserName,
  isHost,
  hasRaisedHand,
  onClose,
  onRaiseHand,
  onLowerHand,
  onAcknowledge
}: HandRaiseQueueProps) {
  const [topicText, setTopicText] = useState("");
  const [showTopicInput, setShowTopicInput] = useState(false);

  const handleRaise = () => {
    if (showTopicInput && topicText.trim()) {
      onRaiseHand(topicText.trim());
      setTopicText("");
      setShowTopicInput(false);
    } else if (!showTopicInput) {
      setShowTopicInput(true);
    } else {
      onRaiseHand();
      setShowTopicInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onRaiseHand(topicText.trim() || undefined);
      setTopicText("");
      setShowTopicInput(false);
    } else if (e.key === "Escape") {
      setShowTopicInput(false);
      setTopicText("");
    }
  };

  const getTimeSinceRaise = (raisedAt: number) => {
    const seconds = Math.floor((Date.now() - raisedAt) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const sortedQueue = [...queue].sort((a, b) => a.raisedAt - b.raisedAt);
  const myPosition = sortedQueue.findIndex(h => h.userId === currentUserId) + 1;

  if (!isOpen) return null;

  return (
    <div className="fixed right-[420px] top-16 w-[320px] bg-[#0a0e14] border border-cyan-900/30 rounded-lg shadow-2xl z-40 flex flex-col font-mono max-h-[60vh]">
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.02] rounded-lg" 
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,200,0,0.02) 1px, rgba(255,200,0,0.02) 2px)'
        }} 
      />

      <div className="flex items-center justify-between h-11 px-4 bg-[#0d1117] border-b border-cyan-900/40 rounded-t-lg">
        <div className="flex items-center gap-2 text-amber-400 text-xs">
          <Hand className="h-3.5 w-3.5" />
          <span className="tracking-wider">SPEAKER_QUEUE</span>
          {queue.length > 0 && (
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
              {queue.length}
            </span>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-6 w-6 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
          data-testid="button-close-hand-queue"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2 max-h-[300px]">
        <div className="space-y-1.5">
          {sortedQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <Sparkles className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-[10px] tracking-widest">QUEUE EMPTY</p>
              <p className="text-[9px] text-slate-700 mt-1">Raise your hand to speak</p>
            </div>
          ) : (
            sortedQueue.map((item, index) => {
              const isCurrentUser = item.userId === currentUserId;
              const position = index + 1;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative rounded border transition-all p-2.5",
                    item.acknowledged
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : isCurrentUser
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-[#0d1117] border-slate-700/30"
                  )}
                  data-testid={`hand-raise-${item.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0",
                      position === 1 
                        ? "bg-amber-500/20 text-amber-400" 
                        : "bg-slate-700/50 text-slate-400"
                    )}>
                      {position}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          isCurrentUser ? "text-amber-300" : "text-white"
                        )}>
                          {isCurrentUser ? "You" : item.userName}
                        </span>
                        {item.acknowledged && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                            SPEAKING
                          </span>
                        )}
                      </div>
                      {item.topic && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {item.topic}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {getTimeSinceRaise(item.raisedAt)} ago
                      </p>
                    </div>

                    {isHost && !item.acknowledged && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onAcknowledge(item.id)}
                        className="h-6 w-6 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                        data-testid={`acknowledge-${item.id}`}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}

                    {isCurrentUser && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={onLowerHand}
                        className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        data-testid="button-lower-hand"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-cyan-900/40 bg-[#0d1117]/80 rounded-b-lg">
        {hasRaisedHand ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <Hand className="h-4 w-4 animate-bounce" />
              <span>Hand raised</span>
              {myPosition > 0 && (
                <span className="text-slate-500">#{myPosition} in queue</span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onLowerHand}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              data-testid="button-lower-hand-main"
            >
              Lower hand
            </Button>
          </div>
        ) : showTopicInput ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#0a0e14] rounded border border-amber-900/30 px-3 py-2 focus-within:border-amber-500/50">
              <MessageSquare className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <input
                type="text"
                value={topicText}
                onChange={(e) => setTopicText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Topic (optional)..."
                className="flex-1 bg-transparent text-amber-100 text-sm placeholder:text-slate-600 focus:outline-none font-mono"
                data-testid="input-hand-topic"
                maxLength={100}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowTopicInput(false); setTopicText(""); }}
                className="flex-1 text-slate-400"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => { onRaiseHand(topicText.trim() || undefined); setTopicText(""); setShowTopicInput(false); }}
                className="flex-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                data-testid="button-confirm-raise"
              >
                <Hand className="h-3.5 w-3.5 mr-1.5" />
                Raise
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleRaise}
            className="w-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            data-testid="button-raise-hand"
          >
            <Hand className="h-4 w-4 mr-2" />
            Raise Hand
          </Button>
        )}
      </div>
    </div>
  );
}

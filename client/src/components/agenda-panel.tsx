import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, Plus, Check, Clock, ChevronUp, ChevronDown, 
  ListChecks, Vote, Timer, GripVertical, Play, Pause
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgendaItem } from "@shared/schema";

interface AgendaPanelProps {
  isOpen: boolean;
  items: AgendaItem[];
  currentUserId: string;
  currentUserName: string;
  isHost: boolean;
  onClose: () => void;
  onAddItem: (title: string) => void;
  onVoteItem: (itemId: string) => void;
  onCompleteItem: (itemId: string) => void;
  onReorderItems: (items: AgendaItem[]) => void;
}

export function AgendaPanel({
  isOpen,
  items,
  currentUserId,
  currentUserName,
  isHost,
  onClose,
  onAddItem,
  onVoteItem,
  onCompleteItem,
  onReorderItems
}: AgendaPanelProps) {
  const [newItemText, setNewItemText] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const activeItem = items.find(item => item.startedAt && !item.isCompleted);
    if (activeItem) {
      setActiveItemId(activeItem.id);
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - activeItem.startedAt!) / 1000));
      }, 1000);
    } else {
      setActiveItemId(null);
      setElapsedTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [items]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    onAddItem(newItemText.trim());
    setNewItemText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    newItems.forEach((item, i) => item.order = i);
    onReorderItems(newItems);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return b.votes.length - a.votes.length || a.order - b.order;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 h-full w-[380px] bg-[#0a0e14] border-r border-cyan-900/30 shadow-2xl z-40 flex flex-col font-mono">
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.02]" 
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,0,0.02) 1px, rgba(0,255,0,0.02) 2px)'
        }} 
      />

      <div className="flex items-center justify-between h-12 px-4 bg-[#0d1117] border-b border-cyan-900/40">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs">
            <ListChecks className="h-3.5 w-3.5" />
            <span className="tracking-wider">LIVE_AGENDA</span>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-7 w-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
          data-testid="button-close-agenda"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {activeItemId && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
          <Timer className="h-4 w-4 text-emerald-400 animate-pulse" />
          <div className="flex-1">
            <p className="text-xs text-emerald-300">Currently Discussing</p>
            <p className="text-sm text-white truncate">
              {items.find(i => i.id === activeItemId)?.title}
            </p>
          </div>
          <div className="text-lg font-bold text-emerald-400 tabular-nums">
            {formatTime(elapsedTime)}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-2">
          {sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600">
              <ListChecks className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-xs tracking-widest">NO AGENDA ITEMS</p>
              <p className="text-[10px] text-slate-700 mt-2">Add items to keep meetings organized</p>
            </div>
          ) : (
            sortedItems.map((item, index) => {
              const hasVoted = item.votes.includes(currentUserId);
              const isActive = item.id === activeItemId;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative rounded border transition-all",
                    item.isCompleted 
                      ? "bg-slate-800/30 border-slate-700/30 opacity-60"
                      : isActive
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-[#0d1117] border-cyan-900/30 hover:border-cyan-500/30"
                  )}
                  data-testid={`agenda-item-${item.id}`}
                >
                  <div className="flex items-start gap-3 p-3">
                    {isHost && !item.isCompleted && (
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          className="p-0.5 text-slate-500 hover:text-cyan-400"
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <GripVertical className="h-3 w-3 text-slate-600" />
                        <button
                          onClick={() => moveItem(index, 'down')}
                          className="p-0.5 text-slate-500 hover:text-cyan-400"
                          disabled={index === sortedItems.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm mb-1",
                        item.isCompleted ? "text-slate-500 line-through" : "text-white"
                      )}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>by {item.createdByName}</span>
                        {item.timeSpent && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTime(item.timeSpent)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!item.isCompleted && (
                        <button
                          onClick={() => onVoteItem(item.id)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs transition-all",
                            hasVoted
                              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                              : "bg-slate-800 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10"
                          )}
                          data-testid={`vote-item-${item.id}`}
                        >
                          <Vote className="h-3 w-3" />
                          <span>{item.votes.length}</span>
                        </button>
                      )}

                      {isHost && !item.isCompleted && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onCompleteItem(item.id)}
                          className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                          data-testid={`complete-item-${item.id}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {item.isCompleted && (
                        <div className="flex items-center gap-1 text-emerald-500 text-xs">
                          <Check className="h-3.5 w-3.5" />
                          <span>Done</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-cyan-900/40 bg-[#0d1117]/80">
        <div className="flex items-center gap-2 bg-[#0a0e14] rounded border border-cyan-900/30 px-3 py-2 focus-within:border-cyan-500/50 transition-all">
          <Plus className="h-4 w-4 text-cyan-500 flex-shrink-0" />
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add agenda item..."
            className="flex-1 bg-transparent text-cyan-100 text-sm placeholder:text-slate-600 focus:outline-none font-mono"
            data-testid="input-agenda-item"
            maxLength={200}
          />
          <Button
            onClick={handleAddItem}
            disabled={!newItemText.trim()}
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-30"
            data-testid="button-add-agenda"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[9px] text-slate-700 px-1">
          <span>ENTER to add • Vote to prioritize</span>
          <span>{items.filter(i => !i.isCompleted).length} pending</span>
        </div>
      </div>
    </div>
  );
}

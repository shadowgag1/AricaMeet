import { Button } from "@/components/ui/button";
import { X, Shield, Mic, MicOff, Video, VideoOff, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isLocal: boolean;
}

interface ParticipantsPanelProps {
  isOpen: boolean;
  participants: Participant[];
  onClose: () => void;
}

export function ParticipantsPanel({ isOpen, participants, onClose }: ParticipantsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 z-40 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="font-semibold text-white">Participants</h2>
            <p className="text-xs text-slate-400">{participants.length} in this meeting</p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          data-testid="button-close-participants"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
              participant.isLocal
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-slate-800/50 border-slate-700/30 hover:bg-slate-800"
            )}
            data-testid={`participant-${participant.id}`}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
              participant.isLocal
                ? "bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-900"
                : "bg-gradient-to-br from-slate-600 to-slate-700 text-white"
            )}>
              {participant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">
                  {participant.name}
                </span>
                {participant.isLocal && (
                  <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 bg-cyan-500/20 rounded-full">
                    You
                  </span>
                )}
                {participant.isHost && (
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {participant.isMuted ? (
                  <MicOff className="h-3 w-3 text-red-400" />
                ) : (
                  <Mic className="h-3 w-3 text-emerald-400" />
                )}
                {participant.isCameraOff ? (
                  <VideoOff className="h-3 w-3 text-red-400" />
                ) : (
                  <Video className="h-3 w-3 text-emerald-400" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Shield className="h-3 w-3 text-cyan-500" />
          <span>All connections are peer-to-peer encrypted</span>
        </div>
      </div>
    </div>
  );
}

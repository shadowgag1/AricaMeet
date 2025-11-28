import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Palette,
  PhoneOff,
  Upload,
  ListChecks,
  Hand,
  MessageSquareLock,
  MoreHorizontal,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ControlBarProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isWhiteboardOpen: boolean;
  isParticipantsOpen: boolean;
  isAgendaOpen: boolean;
  isHandRaised: boolean;
  isPrivateChatOpen: boolean;
  participantCount: number;
  handRaiseCount: number;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleWhiteboard: () => void;
  onToggleParticipants: () => void;
  onToggleAgenda: () => void;
  onToggleHandRaise: () => void;
  onTogglePrivateChat: () => void;
  onOpenFileShare: () => void;
  onLeave: () => void;
}

export function ControlBar({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  isChatOpen,
  isWhiteboardOpen,
  isParticipantsOpen,
  isAgendaOpen,
  isHandRaised,
  isPrivateChatOpen,
  participantCount,
  handRaiseCount,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onToggleChat,
  onToggleWhiteboard,
  onToggleParticipants,
  onToggleAgenda,
  onToggleHandRaise,
  onTogglePrivateChat,
  onOpenFileShare,
  onLeave
}: ControlBarProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreMenuItems = [
    { icon: Monitor, label: "Screen", isActive: isScreenSharing, onClick: onToggleScreenShare, showOnMobile: true },
    { icon: Palette, label: "Whiteboard", isActive: isWhiteboardOpen, onClick: onToggleWhiteboard },
    { icon: Upload, label: "Files", isActive: false, onClick: onOpenFileShare },
    { icon: ListChecks, label: "Agenda", isActive: isAgendaOpen, onClick: onToggleAgenda, activeColor: "emerald" },
    { icon: MessageSquareLock, label: "Private", isActive: isPrivateChatOpen, onClick: onTogglePrivateChat, activeColor: "violet" },
    { icon: Users, label: "People", isActive: isParticipantsOpen, onClick: onToggleParticipants, badge: participantCount },
  ];

  return (
    <div className="relative bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-3 sm:px-6 py-3 sm:py-4 safe-area-inset-bottom">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleMic}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border touch-target",
            isMicOn 
              ? "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white" 
              : "bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400"
          )}
          data-testid="button-toggle-mic"
        >
          {isMicOn ? (
            <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleCamera}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border touch-target",
            isCameraOn 
              ? "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white" 
              : "bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400"
          )}
          data-testid="button-toggle-camera"
        >
          {isCameraOn ? (
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleScreenShare}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border touch-target hidden sm:flex",
            isScreenSharing 
              ? "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-400" 
              : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
          )}
          data-testid="button-toggle-screen-share"
        >
          {isScreenSharing ? (
            <MonitorOff className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>

        <div className="w-px h-6 sm:h-7 bg-slate-700 mx-0.5 sm:mx-1 hidden sm:block" />

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleWhiteboard}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border touch-target hidden lg:flex",
            isWhiteboardOpen 
              ? "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-400" 
              : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
          )}
          data-testid="button-toggle-whiteboard"
        >
          <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onOpenFileShare}
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white transition-all duration-200 touch-target hidden lg:flex"
          data-testid="button-open-file-share"
        >
          <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleAgenda}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border touch-target hidden lg:flex",
            isAgendaOpen 
              ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-400" 
              : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
          )}
          data-testid="button-toggle-agenda"
        >
          <ListChecks className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleHandRaise}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border relative touch-target",
            isHandRaised 
              ? "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-400 animate-pulse" 
              : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
          )}
          data-testid="button-toggle-hand-raise"
        >
          <Hand className="h-4 w-4 sm:h-5 sm:w-5" />
          {handRaiseCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-[10px] sm:text-xs font-semibold rounded-full h-4 sm:h-5 min-w-4 sm:min-w-5 px-0.5 sm:px-1 flex items-center justify-center">
              {handRaiseCount}
            </span>
          )}
        </Button>

        <div className="w-px h-6 sm:h-7 bg-slate-700 mx-0.5 sm:mx-1" />

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleChat}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border touch-target",
            isChatOpen 
              ? "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-400" 
              : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
          )}
          data-testid="button-toggle-chat"
        >
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onTogglePrivateChat}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border touch-target hidden lg:flex",
            isPrivateChatOpen 
              ? "bg-violet-500/20 hover:bg-violet-500/30 border-violet-500/50 text-violet-400" 
              : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
          )}
          data-testid="button-toggle-private-chat"
        >
          <MessageSquareLock className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleParticipants}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border relative touch-target hidden lg:flex",
            isParticipantsOpen 
              ? "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-400" 
              : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
          )}
          data-testid="button-participants"
        >
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900 text-[10px] sm:text-xs font-semibold rounded-full h-4 sm:h-5 min-w-4 sm:min-w-5 px-0.5 sm:px-1 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            {participantCount}
          </span>
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={cn(
            "h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all duration-200 border touch-target lg:hidden",
            isMoreOpen 
              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" 
              : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-white"
          )}
          data-testid="button-more-options"
        >
          {isMoreOpen ? (
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>

        <div className="w-px h-6 sm:h-7 bg-slate-700 mx-0.5 sm:mx-1" />

        <Button
          variant="ghost"
          onClick={onLeave}
          className="h-10 sm:h-11 px-3 sm:px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 shadow-lg shadow-red-500/20 touch-target"
          data-testid="button-leave-meeting"
        >
          <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">Leave</span>
        </Button>
      </div>

      {isMoreOpen && (
        <div 
          className="absolute bottom-full left-0 right-0 mb-2 px-4 lg:hidden"
          role="menu"
          aria-label="More meeting controls"
        >
          <div className="bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 shadow-2xl">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {moreMenuItems.map((item, index) => {
                const Icon = item.icon;
                const activeColor = item.activeColor || "cyan";
                const activeClasses = 
                  activeColor === "emerald" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                  activeColor === "violet" ? "bg-violet-500/20 border-violet-500/50 text-violet-400" :
                  "bg-cyan-500/20 border-cyan-500/50 text-cyan-400";
                
                return (
                  <button
                    key={item.label}
                    role="menuitem"
                    tabIndex={0}
                    aria-label={`${item.label}${item.isActive ? ' (active)' : ''}${item.badge ? ` (${item.badge})` : ''}`}
                    onClick={() => {
                      item.onClick();
                      setIsMoreOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        item.onClick();
                        setIsMoreOpen(false);
                      } else if (e.key === 'Escape') {
                        setIsMoreOpen(false);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all min-h-[72px] relative focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                      item.isActive 
                        ? activeClasses
                        : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
                    )}
                    data-testid={`button-more-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="absolute top-1 right-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900 text-[9px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Video, Mic, User } from "lucide-react";

interface PreJoinModalProps {
  meetingCode: string;
  onJoin: (name: string) => void;
  onCancel: () => void;
}

export function PreJoinModal({ meetingCode, onJoin, onCancel }: PreJoinModalProps) {
  const [name, setName] = useState(() => {
    return sessionStorage.getItem('meetUserName') || '';
  });

  const handleJoin = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      sessionStorage.setItem('meetUserName', trimmedName);
      onJoin(trimmedName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white space-grotesk">Ready to Join?</h2>
              <p className="text-sm text-slate-400">Enter your name to continue</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center gap-3 py-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <span className="text-slate-400 text-sm">Meeting code:</span>
            <span className="text-cyan-400 font-mono text-lg">{meetingCode}</span>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-slate-400 flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Name
            </label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && handleJoin()}
              className="h-14 px-5 text-base rounded-xl bg-slate-800/80 border-2 border-slate-600 focus:border-cyan-500 text-white placeholder:text-slate-500 transition-all duration-300 focus:shadow-[0_0_20px_rgba(0,217,255,0.15)]"
              data-testid="input-user-name"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-4 py-3 px-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Video className="h-4 w-4 text-cyan-400" />
              <span>Camera</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Mic className="h-4 w-4 text-cyan-400" />
              <span>Microphone</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700/50 bg-slate-800/30 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white"
            data-testid="button-cancel-join"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            disabled={!name.trim()}
            className="flex-1 h-12 rounded-xl btn-gradient-cyan text-slate-900 font-medium shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            data-testid="button-confirm-join"
          >
            Join Meeting
          </Button>
        </div>
      </div>
    </div>
  );
}

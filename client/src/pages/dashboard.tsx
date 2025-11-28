import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Shield, Users, Lock, Zap, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PreJoinModal } from "@/components/pre-join-modal";
import { MatrixRain } from "@/components/matrix-rain";
import { LightweightModeToggle } from "@/components/lightweight-mode";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [meetingCode, setMeetingCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showPreJoin, setShowPreJoin] = useState(false);
  const [pendingMeetingCode, setPendingMeetingCode] = useState("");
  const { toast } = useToast();

  const attemptTimestampsRef = useRef<number[]>([]);
  const cooldownEndRef = useRef(0);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    
    if (now < cooldownEndRef.current) {
      const remainingSeconds = Math.ceil((cooldownEndRef.current - now) / 1000);
      toast({
        title: "Please wait",
        description: `You can try again in ${remainingSeconds} seconds.`,
        variant: "destructive",
      });
      return false;
    }

    attemptTimestampsRef.current = attemptTimestampsRef.current.filter(
      timestamp => now - timestamp < 60000
    );

    if (attemptTimestampsRef.current.length >= 5) {
      cooldownEndRef.current = now + 5000;
      toast({
        title: "Too many attempts",
        description: "Please wait 5 seconds before trying again.",
        variant: "destructive",
      });
      return false;
    }

    attemptTimestampsRef.current.push(now);
    return true;
  };

  const generateMeetingCode = (): string => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) code += "-";
    }
    return code;
  };

  const handleStartMeeting = async () => {
    if (!checkRateLimit()) return;

    const code = generateMeetingCode();
    setPendingMeetingCode(code);
    setShowPreJoin(true);
  };

  const handleJoinMeeting = async () => {
    if (!checkRateLimit()) return;

    const cleanCode = meetingCode.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    if (!cleanCode || cleanCode.length < 11) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid meeting code (format: xxxx-xxxx-xxxx-xxxx)",
        variant: "destructive",
      });
      return;
    }

    setPendingMeetingCode(cleanCode);
    setShowPreJoin(true);
  };

  const handleConfirmJoin = (name: string) => {
    setIsJoining(true);
    setLocation(`/meeting/${pendingMeetingCode}`);
  };

  const handleCancelJoin = () => {
    setShowPreJoin(false);
    setPendingMeetingCode("");
  };

  return (
    <div className="min-h-screen cyber-gradient flex flex-col relative overflow-hidden">
      <MatrixRain opacity={0.08} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,217,255,0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,168,204,0.05)_0%,_transparent_40%)]" />
      
      <header className="relative flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-700/50 safe-area-inset-top">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-slate-900" />
          </div>
          <span className="text-lg sm:text-xl font-semibold space-grotesk text-white">
            Arica<span className="text-cyan-400">Meet</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LightweightModeToggle />
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
            <Lock className="h-4 w-4 text-cyan-400" />
            <span>Encrypted</span>
          </div>
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div className="space-y-6 sm:space-y-10">
            <div className="space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs sm:text-sm text-cyan-400">
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Enterprise-Grade Security</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold space-grotesk text-white leading-tight">
                Secure Video
                <br />
                <span className="text-gradient-cyan">Conferencing</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-md leading-relaxed">
                Zero-trust peer-to-peer meetings with end-to-end encryption. No data collection, no tracking, complete privacy.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <Button
                onClick={handleStartMeeting}
                disabled={isJoining}
                className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-medium rounded-xl gap-2 sm:gap-3 btn-gradient-cyan text-slate-900 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 touch-target"
                data-testid="button-start-meeting"
              >
                <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                Start New Meeting
              </Button>

              <div className="flex items-center gap-3 text-slate-500 text-xs sm:text-sm">
                <div className="flex-1 h-px bg-slate-700" />
                <span>or join existing</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Enter meeting code"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleJoinMeeting()}
                    className="h-12 sm:h-14 pl-4 sm:pl-5 pr-4 text-sm sm:text-base rounded-xl bg-slate-800/80 border-2 border-slate-600 focus:border-cyan-500 text-white placeholder:text-slate-500 jetbrains-mono transition-all duration-300 focus:shadow-[0_0_20px_rgba(0,217,255,0.15)]"
                    data-testid="input-meeting-code"
                    disabled={isJoining}
                  />
                </div>
                <Button
                  onClick={handleJoinMeeting}
                  disabled={!meetingCode.trim() || isJoining}
                  variant="outline"
                  className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-medium rounded-xl border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500 transition-all duration-300 touch-target"
                  data-testid="button-join-meeting"
                >
                  Join
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative p-8 space-y-6 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl" />
              
              <div className="relative aspect-video bg-slate-950 rounded-xl flex items-center justify-center border border-slate-700/50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,217,255,0.03)_0%,_transparent_70%)]" />
                <div className="relative flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-slate-700">
                    <Users className="h-10 w-10 text-cyan-400" />
                  </div>
                  <p className="text-sm text-slate-500">Your video preview</p>
                </div>
              </div>
              
              <div className="relative grid grid-cols-3 gap-4 pt-4">
                <div className="flex flex-col items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                    <Lock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-400 text-center">E2E Encrypted</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div className="w-11 h-11 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <Eye className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-xs text-slate-400 text-center">Zero Tracking</span>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div className="w-11 h-11 bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-xl flex items-center justify-center border border-violet-500/20">
                    <Zap className="h-5 w-5 text-violet-400" />
                  </div>
                  <span className="text-xs text-slate-400 text-center">P2P Direct</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative py-5 px-8 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>AricaMeet - Secure Communications</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-cyan-500" />
              Enterprise Security
            </span>
          </div>
        </div>
      </footer>

      {showPreJoin && (
        <PreJoinModal
          meetingCode={pendingMeetingCode}
          onJoin={handleConfirmJoin}
          onCancel={handleCancelJoin}
        />
      )}
    </div>
  );
}

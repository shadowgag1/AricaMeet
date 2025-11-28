import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Pin, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  isMuted?: boolean;
  participantName?: string;
  onToggleFullscreen?: () => void;
  className?: string;
}

export function VideoTile({
  stream,
  isLocal = false,
  isMuted = false,
  participantName = "You",
  onToggleFullscreen,
  className
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const videoTrack = stream.getVideoTracks()[0];
      setHasVideo(videoTrack?.enabled ?? false);
    }
  }, [stream]);

  useEffect(() => {
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const handleTrackChange = () => {
      setHasVideo(videoTrack.enabled);
    };

    videoTrack.addEventListener('ended', handleTrackChange);
    const interval = setInterval(() => {
      setHasVideo(videoTrack.enabled);
    }, 500);

    return () => {
      videoTrack.removeEventListener('ended', handleTrackChange);
      clearInterval(interval);
    };
  }, [stream]);

  useEffect(() => {
    if (!stream || isMuted) {
      setIsSpeaking(false);
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setIsSpeaking(false);
      return;
    }

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const SPEAKING_THRESHOLD = 15;

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        setIsSpeaking(average > SPEAKING_THRESHOLD);
        
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    } catch (error) {
      setIsSpeaking(false);
    }
  }, [stream, isMuted]);

  const initials = participantName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden bg-slate-900 group transition-all duration-200",
        isSpeaking 
          ? "border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,217,255,0.4)]" 
          : "border border-slate-700/50",
        className
      )}
      data-testid={`video-tile-${isLocal ? 'local' : 'remote'}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isMuted}
        className={cn(
          "w-full h-full object-cover absolute inset-0",
          hasVideo && stream ? "opacity-100" : "opacity-0"
        )}
      />
      {(!hasVideo || !stream) && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,217,255,0.03)_0%,_transparent_70%)]" />
          <div className={cn(
            "relative rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border transition-all duration-200",
            isSpeaking ? "border-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.5)]" : "border-slate-600"
          )} style={{ width: '30%', maxWidth: '120px', aspectRatio: '1' }}>
            <span className="text-white text-2xl md:text-4xl font-medium">{initials}</span>
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-cyan-500/20 backdrop-blur-sm px-2 py-1 rounded-full border border-cyan-400/30">
          <div className="flex items-center gap-0.5">
            <div className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <div className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse delay-75" />
            <div className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse delay-150" />
          </div>
          <span className="text-[10px] text-cyan-400 font-medium">Speaking</span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className={cn(
          "flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 rounded-lg border transition-all duration-200",
          isSpeaking 
            ? "bg-cyan-900/50 border-cyan-500/30" 
            : "bg-slate-900/80 border-slate-700/50"
        )}>
          {isMuted ? (
            <MicOff className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Mic className={cn(
              "h-3.5 w-3.5 transition-colors",
              isSpeaking ? "text-cyan-400" : "text-slate-500"
            )} />
          )}
          {isLocal && (
            <Shield className="h-3 w-3 text-cyan-400" />
          )}
          <span className="text-xs font-medium text-white">{participantName}</span>
        </div>

        {onToggleFullscreen && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleFullscreen}
            className="bg-slate-900/80 backdrop-blur-sm hover:bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-lg border border-slate-700/50"
            data-testid="button-fullscreen"
          >
            <Pin className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

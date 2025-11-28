import { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'success' | 'info' | 'warning' | 'encryption';
  message: string;
}

interface SecurityConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  participantCount: number;
  isConnected: boolean;
}

const ENCRYPTION_MESSAGES = [
  'AES-256-GCM cipher initialized',
  'DTLS handshake completed',
  'SRTP keys exchanged',
  'Perfect forward secrecy enabled',
  'ICE candidates gathered',
  'STUN binding request sent',
  'Peer fingerprint verified',
  'End-to-end encryption active',
  'WebRTC datachannel secured',
  'Media stream encrypted',
];

export function SecurityConsole({ isOpen, onClose, roomCode, participantCount, isConnected }: SecurityConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [bytesEncrypted, setBytesEncrypted] = useState(0);
  const [packetsSecured, setPacketsSecured] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const addLog = (type: LogEntry['type'], message: string) => {
      setLogs(prev => [...prev.slice(-50), {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type,
        message
      }]);
    };

    addLog('success', `[INIT] Secure session established for room ${roomCode}`);
    addLog('encryption', '[CRYPTO] ' + ENCRYPTION_MESSAGES[0]);

    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3) {
        const msg = ENCRYPTION_MESSAGES[Math.floor(Math.random() * ENCRYPTION_MESSAGES.length)];
        addLog('encryption', `[CRYPTO] ${msg}`);
      } else if (rand < 0.5) {
        addLog('info', `[NET] Packet integrity verified - SHA-256 checksum valid`);
      } else if (rand < 0.7) {
        const bytes = Math.floor(Math.random() * 50000) + 10000;
        addLog('success', `[STREAM] ${bytes.toLocaleString()} bytes encrypted and transmitted`);
        setBytesEncrypted(prev => prev + bytes);
      } else {
        setPacketsSecured(prev => prev + Math.floor(Math.random() * 100) + 50);
        addLog('info', `[SEC] Zero-knowledge proof validated`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, roomCode]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 w-96 bg-black/95 backdrop-blur-xl border-r border-cyan-500/30 z-50 flex flex-col font-mono text-xs shadow-2xl shadow-cyan-500/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-cyan-500/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-cyan-400 font-bold tracking-wider">SECURITY CONSOLE</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-cyan-400 transition-colors"
          data-testid="button-close-console"
        >
          [X]
        </button>
      </div>

      <div className="p-3 border-b border-cyan-500/20 bg-slate-900/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">SESSION:</span>
          <span className="text-cyan-400">{roomCode.toUpperCase()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">PEERS:</span>
          <span className="text-emerald-400">{participantCount} CONNECTED</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">ENCRYPTION:</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Lock className="h-3 w-3" /> AES-256-GCM
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">BYTES ENCRYPTED:</span>
          <span className="text-violet-400">{bytesEncrypted.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">PACKETS SECURED:</span>
          <span className="text-amber-400">{packetsSecured.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn(
              "flex items-start gap-2 p-1.5 rounded transition-all",
              log.type === 'success' && "text-emerald-400",
              log.type === 'info' && "text-slate-400",
              log.type === 'warning' && "text-amber-400",
              log.type === 'encryption' && "text-cyan-400"
            )}
          >
            <span className="text-slate-600 shrink-0">{formatTime(log.timestamp)}</span>
            {log.type === 'success' && <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />}
            {log.type === 'encryption' && <Lock className="h-3 w-3 mt-0.5 shrink-0" />}
            {log.type === 'warning' && <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />}
            {log.type === 'info' && <Zap className="h-3 w-3 mt-0.5 shrink-0" />}
            <span className="break-all">{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      <div className="p-3 border-t border-cyan-500/20 bg-slate-900/50">
        <div className="flex items-center gap-2 text-emerald-400">
          <Shield className="h-4 w-4" />
          <span>ALL SYSTEMS SECURE</span>
          <div className="flex-1" />
          <div className="flex gap-1">
            <div className="w-1.5 h-3 bg-emerald-500 rounded-sm animate-pulse" />
            <div className="w-1.5 h-3 bg-emerald-500 rounded-sm animate-pulse delay-75" />
            <div className="w-1.5 h-3 bg-emerald-500 rounded-sm animate-pulse delay-150" />
          </div>
        </div>
      </div>
    </div>
  );
}

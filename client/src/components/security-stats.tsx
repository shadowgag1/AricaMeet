import { useState, useEffect } from 'react';
import { Shield, Lock, Zap, Clock, Activity, Database } from 'lucide-react';

interface SecurityStatsProps {
  isVisible: boolean;
  startTime: number;
}

export function SecurityStats({ isVisible, startTime }: SecurityStatsProps) {
  const [stats, setStats] = useState({
    bytesEncrypted: 0,
    packetsSecured: 0,
    latency: 0,
    uptime: 0,
  });

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        bytesEncrypted: prev.bytesEncrypted + Math.floor(Math.random() * 50000) + 10000,
        packetsSecured: prev.packetsSecured + Math.floor(Math.random() * 100) + 20,
        latency: Math.floor(Math.random() * 30) + 10,
        uptime: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, startTime]);

  if (!isVisible) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-16 left-4 z-30 bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 font-mono text-xs space-y-2 shadow-lg shadow-cyan-500/10">
      <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-500/20 pb-2 mb-2">
        <Shield className="h-3 w-3" />
        <span className="font-bold tracking-wider">SECURITY METRICS</span>
      </div>

      <div className="flex items-center gap-3">
        <Database className="h-3 w-3 text-violet-400" />
        <span className="text-slate-500">ENCRYPTED:</span>
        <span className="text-violet-400">{formatBytes(stats.bytesEncrypted)}</span>
      </div>

      <div className="flex items-center gap-3">
        <Lock className="h-3 w-3 text-emerald-400" />
        <span className="text-slate-500">PACKETS:</span>
        <span className="text-emerald-400">{stats.packetsSecured.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-3">
        <Activity className="h-3 w-3 text-amber-400" />
        <span className="text-slate-500">LATENCY:</span>
        <span className="text-amber-400">{stats.latency}ms</span>
      </div>

      <div className="flex items-center gap-3">
        <Clock className="h-3 w-3 text-cyan-400" />
        <span className="text-slate-500">UPTIME:</span>
        <span className="text-cyan-400">{formatUptime(stats.uptime)}</span>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-cyan-500/20">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-emerald-400">ALL SYSTEMS NOMINAL</span>
      </div>
    </div>
  );
}

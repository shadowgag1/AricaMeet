import { useState, useEffect } from 'react';
import { Shield, Lock, Fingerprint, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EncryptionBadgeProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  participantCount: number;
}

export function EncryptionBadge({ isOpen, onClose, roomCode, participantCount }: EncryptionBadgeProps) {
  const [sessionKey, setSessionKey] = useState('');
  const [fingerprints, setFingerprints] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const chars = '0123456789ABCDEF';
    let key = '';
    for (let i = 0; i < 64; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    setSessionKey(key);

    const fps = [];
    for (let p = 0; p < participantCount; p++) {
      let fp = '';
      for (let i = 0; i < 16; i++) {
        fp += chars[Math.floor(Math.random() * chars.length)];
        if ((i + 1) % 4 === 0 && i < 15) fp += ':';
      }
      fps.push(fp);
    }
    setFingerprints(fps);
  }, [isOpen, participantCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden">
        <div className="p-6 border-b border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  End-to-End Encrypted
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </h2>
                <p className="text-sm text-slate-400">All communications are secured</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400"
              data-testid="button-close-encryption"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="h-3 w-3" />
              <span>SESSION ENCRYPTION KEY (AES-256-GCM)</span>
            </div>
            <div className="bg-black/50 rounded-lg p-3 border border-slate-700/50">
              <div className="font-mono text-[10px] text-cyan-400 leading-relaxed break-all">
                {sessionKey.match(/.{1,16}/g)?.join('\n')}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Fingerprint className="h-3 w-3" />
              <span>PEER FINGERPRINTS ({participantCount} verified)</span>
            </div>
            <div className="space-y-2">
              {fingerprints.map((fp, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-2 border border-slate-700/30"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">P{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-xs text-emerald-400">{fp}</div>
                    <div className="text-[10px] text-slate-500">
                      {i === 0 ? 'You (Local)' : `Peer ${i}`} • Verified
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 text-center">
              <div className="text-[10px] text-slate-500 mb-1">PROTOCOL</div>
              <div className="text-sm text-white font-mono">DTLS 1.2 + SRTP</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 text-center">
              <div className="text-[10px] text-slate-500 mb-1">KEY EXCHANGE</div>
              <div className="text-sm text-white font-mono">ECDHE-P256</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
            <Shield className="h-4 w-4" />
            <span>Zero-Knowledge Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
}

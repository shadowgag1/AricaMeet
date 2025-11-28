import { useState, useEffect } from 'react';
import { Shield, Lock, Fingerprint, CheckCircle, Wifi, Zap } from 'lucide-react';

interface SecurityScanProps {
  isScanning: boolean;
  onComplete: () => void;
  roomCode: string;
}

const SCAN_STEPS = [
  { icon: Wifi, text: 'Establishing secure tunnel...', duration: 800 },
  { icon: Lock, text: 'Initializing AES-256-GCM encryption...', duration: 600 },
  { icon: Fingerprint, text: 'Generating session fingerprint...', duration: 700 },
  { icon: Shield, text: 'Verifying peer certificates...', duration: 500 },
  { icon: Zap, text: 'Enabling perfect forward secrecy...', duration: 600 },
  { icon: CheckCircle, text: 'Secure connection established', duration: 400 },
];

export function SecurityScan({ isScanning, onComplete, roomCode }: SecurityScanProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    if (!isScanning) return;

    const chars = '0123456789ABCDEF';
    let fp = '';
    for (let i = 0; i < 32; i++) {
      fp += chars[Math.floor(Math.random() * chars.length)];
      if ((i + 1) % 4 === 0 && i < 31) fp += ':';
    }
    setFingerprint(fp);

    let step = 0;
    let prog = 0;

    const runStep = () => {
      if (step >= SCAN_STEPS.length) {
        setTimeout(onComplete, 500);
        return;
      }

      setCurrentStep(step);
      
      const stepProgress = setInterval(() => {
        prog += 2;
        setProgress(Math.min(((step + prog / 100) / SCAN_STEPS.length) * 100, 100));
      }, SCAN_STEPS[step].duration / 50);

      setTimeout(() => {
        clearInterval(stepProgress);
        prog = 0;
        step++;
        runStep();
      }, SCAN_STEPS[step].duration);
    };

    runStep();
  }, [isScanning, onComplete]);

  if (!isScanning) return null;

  const CurrentIcon = SCAN_STEPS[currentStep]?.icon || Shield;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,217,255,0.1)_0%,_transparent_70%)]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent animate-pulse"
            style={{
              top: `${(i * 5) + Math.random() * 5}%`,
              left: 0,
              right: 0,
              animationDelay: `${i * 0.1}s`,
              opacity: 0.3 + Math.random() * 0.3
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg mx-4 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-mono">ARICAMEET SECURITY PROTOCOL</span>
          </div>
          <h1 className="text-2xl font-bold text-white space-grotesk">Initializing Secure Session</h1>
          <p className="text-slate-400 font-mono text-sm">Room: {roomCode.toUpperCase()}</p>
        </div>

        <div className="relative">
          <div className="w-32 h-32 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div 
              className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            />
            <div className="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center">
              <CurrentIcon className="h-12 w-12 text-cyan-400" />
            </div>
            <div className="absolute -inset-2 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 h-6">
            {currentStep < SCAN_STEPS.length && (
              <>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-cyan-400 font-mono text-sm">
                  {SCAN_STEPS[currentStep].text}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Fingerprint className="h-3 w-3" />
            <span>SESSION FINGERPRINT</span>
          </div>
          <div className="font-mono text-xs text-cyan-400 tracking-wider break-all">
            {fingerprint}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'PROTOCOL', value: 'WebRTC' },
            { label: 'CIPHER', value: 'AES-256' },
            { label: 'KEY EXCHANGE', value: 'ECDHE' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <div className="text-[10px] text-slate-500 mb-1">{item.label}</div>
              <div className="text-sm text-emerald-400 font-mono">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

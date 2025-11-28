import { useEffect, useRef, useState } from 'react';
import { X, Shield, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Peer {
  id: string;
  name: string;
  isLocal: boolean;
}

interface NetworkTopologyProps {
  isOpen: boolean;
  onClose: () => void;
  peers: Peer[];
  localUserId: string;
}

export function NetworkTopology({ isOpen, onClose, peers, localUserId }: NetworkTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = 500;
    const height = canvas.height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 120;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, width, height);

    const nodePositions: { x: number; y: number; peer: Peer }[] = [];
    
    peers.forEach((peer, index) => {
      if (peer.isLocal) {
        nodePositions.push({ x: centerX, y: centerY, peer });
      } else {
        const angle = (index / (peers.length - 1 || 1)) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        nodePositions.push({ x, y, peer });
      }
    });

    const localNode = nodePositions.find(n => n.peer.isLocal);
    if (localNode) {
      nodePositions.forEach((node) => {
        if (!node.peer.isLocal) {
          const progress = (animationFrame % 60) / 60;
          
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.moveTo(localNode.x, localNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();

          const packetX = localNode.x + (node.x - localNode.x) * progress;
          const packetY = localNode.y + (node.y - localNode.y) * progress;
          
          ctx.beginPath();
          ctx.fillStyle = '#00d9ff';
          ctx.shadowColor = '#00d9ff';
          ctx.shadowBlur = 10;
          ctx.arc(packetX, packetY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          const returnProgress = ((animationFrame + 30) % 60) / 60;
          const returnX = node.x + (localNode.x - node.x) * returnProgress;
          const returnY = node.y + (localNode.y - node.y) * returnProgress;
          
          ctx.beginPath();
          ctx.fillStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 10;
          ctx.arc(returnX, returnY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    }

    nodePositions.forEach((node) => {
      ctx.beginPath();
      ctx.fillStyle = node.peer.isLocal ? '#00d9ff' : '#1e293b';
      ctx.strokeStyle = node.peer.isLocal ? '#00d9ff' : '#475569';
      ctx.lineWidth = 2;
      ctx.shadowColor = node.peer.isLocal ? '#00d9ff' : 'transparent';
      ctx.shadowBlur = node.peer.isLocal ? 20 : 0;
      ctx.arc(node.x, node.y, node.peer.isLocal ? 30 : 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = node.peer.isLocal ? '#0a0e1a' : '#fff';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = node.peer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      ctx.fillText(initials, node.x, node.y);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter';
      ctx.fillText(node.peer.isLocal ? 'YOU (HOST)' : node.peer.name, node.x, node.y + 40);
    });

    ctx.fillStyle = '#00d9ff';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(`MESH TOPOLOGY | ${peers.length} NODES | FULLY CONNECTED`, 10, height - 10);

  }, [isOpen, peers, animationFrame, localUserId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Wifi className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-semibold text-white">Network Topology</h2>
              <p className="text-xs text-slate-400">P2P Mesh Visualization</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-700 text-slate-400"
            data-testid="button-close-topology"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <canvas ref={canvasRef} className="rounded-xl" />
        </div>

        <div className="px-5 py-3 border-t border-cyan-500/20 bg-slate-800/30 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-full" />
            <span className="text-slate-400">Data Packet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-slate-400">ACK Response</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-cyan-400" />
            <span className="text-slate-400">E2E Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

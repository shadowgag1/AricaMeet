import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Pencil, Eraser, Undo, Trash2, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhiteboardEvent } from "@shared/schema";

interface WhiteboardProps {
  isOpen: boolean;
  isHost: boolean;
  hasAccess: boolean;
  events?: WhiteboardEvent[];
  onClose: () => void;
  onRequestAccess: () => void;
  onDraw: (data: any) => void;
  onErase: (data: any) => void;
  onUndo: () => void;
  onClear: () => void;
}

export function Whiteboard({
  isOpen,
  isHost,
  hasAccess,
  events = [],
  onClose,
  onRequestAccess,
  onDraw,
  onErase,
  onUndo,
  onClear
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null);

  const canEdit = hasAccess || isHost;

  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const processableEvents = events.reduce((acc: WhiteboardEvent[], event) => {
      if (event.type === 'undo') {
        if (acc.length > 0) {
          const lastEvent = acc[acc.length - 1];
          const strokeIdToRemove = lastEvent.data?.strokeId;
          if (strokeIdToRemove) {
            return acc.filter(e => e.data?.strokeId !== strokeIdToRemove);
          } else {
            acc.pop();
          }
        }
      } else if (event.type === 'clear') {
        return [];
      } else {
        acc.push(event);
      }
      return acc;
    }, []);

    processableEvents.forEach(event => {
      if (event.type === 'draw' && event.data && 
          typeof event.data.x === 'number' && typeof event.data.y === 'number' &&
          typeof event.data.prevX === 'number' && typeof event.data.prevY === 'number') {
        ctx.strokeStyle = event.data.color || '#00d9ff';
        ctx.lineWidth = event.data.lineWidth || 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(event.data.prevX, event.data.prevY);
        ctx.lineTo(event.data.x, event.data.y);
        ctx.stroke();
      } else if (event.type === 'erase' && event.data && 
                 typeof event.data.x === 'number' && typeof event.data.y === 'number') {
        ctx.clearRect(event.data.x - 10, event.data.y - 10, 20, 20);
      }
    });
  }, [isOpen, events]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canEdit) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setLastPos(coords);
    setCurrentStrokeId(Date.now().toString() + Math.random().toString(36).substring(2, 9));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos || !canEdit || !currentStrokeId) return;

    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (tool === 'draw') {
      ctx.strokeStyle = '#00d9ff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      onDraw({
        x: coords.x,
        y: coords.y,
        prevX: lastPos.x,
        prevY: lastPos.y,
        color: '#00d9ff',
        lineWidth: 3,
        strokeId: currentStrokeId
      });
    } else {
      ctx.clearRect(coords.x - 10, coords.y - 10, 20, 20);
      onErase({
        x: coords.x,
        y: coords.y,
        strokeId: currentStrokeId
      });
    }

    setLastPos(coords);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPos(null);
    setCurrentStrokeId(null);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a0e1a]/95 backdrop-blur-sm z-50 flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,217,255,0.05)_0%,_transparent_50%)]" />
      
      <div className="relative bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <h3 className="text-white text-base font-medium space-grotesk">Whiteboard</h3>
          </div>
          
          {canEdit ? (
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTool('draw')}
                data-testid="button-tool-draw"
                className={cn(
                  "h-9 px-4 rounded-xl text-slate-300 border transition-all duration-200",
                  tool === 'draw' 
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent hover:bg-slate-800 hover:border-slate-700"
                )}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Draw
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTool('erase')}
                data-testid="button-tool-erase"
                className={cn(
                  "h-9 px-4 rounded-xl text-slate-300 border transition-all duration-200",
                  tool === 'erase' 
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" 
                    : "border-transparent hover:bg-slate-800 hover:border-slate-700"
                )}
              >
                <Eraser className="h-4 w-4 mr-2" />
                Erase
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onUndo}
                data-testid="button-undo"
                className="h-9 w-9 rounded-xl text-slate-300 hover:bg-slate-800 border border-transparent hover:border-slate-700"
              >
                <Undo className="h-4 w-4" />
              </Button>
              {isHost && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  data-testid="button-clear-whiteboard"
                  className="h-9 px-4 rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 ml-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Lock className="h-4 w-4" />
                <span>View only</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRequestAccess}
                data-testid="button-request-access"
                className="h-9 px-4 rounded-xl text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30 text-sm"
              >
                Request edit access
              </Button>
            </div>
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700"
          data-testid="button-close-whiteboard"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-6">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={cn(
            "bg-white rounded-xl shadow-2xl max-w-full max-h-full border border-slate-700/30",
            canEdit ? (tool === 'erase' ? "cursor-cell" : "cursor-crosshair") : "cursor-default"
          )}
          style={{ width: '90%', height: '90%' }}
          data-testid="canvas-whiteboard"
        />
      </div>
    </div>
  );
}

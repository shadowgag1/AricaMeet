import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  X, Upload, Download, FileIcon, Pause, Play, 
  CheckCircle, XCircle, Shield, Zap, HardDrive
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileTransfer } from "@shared/schema";

const CHUNK_SIZE = 64 * 1024;
const MAX_FILE_SIZE = 1024 * 1024 * 1024;

interface LargeFileTransferProps {
  isOpen: boolean;
  transfers: FileTransfer[];
  currentUserId: string;
  onClose: () => void;
  onSelectFile: (file: File) => void;
  onPauseTransfer: (transferId: string) => void;
  onResumeTransfer: (transferId: string) => void;
  onCancelTransfer: (transferId: string) => void;
}

export function LargeFileTransfer({
  isOpen,
  transfers,
  currentUserId,
  onClose,
  onSelectFile,
  onPauseTransfer,
  onResumeTransfer,
  onCancelTransfer
}: LargeFileTransferProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return '0 B/s';
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const formatETA = (bytesRemaining: number, speed: number) => {
    if (speed === 0) return '--:--';
    const seconds = Math.ceil(bytesRemaining / speed);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size <= MAX_FILE_SIZE) {
        onSelectFile(file);
      }
    }
  }, [onSelectFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size <= MAX_FILE_SIZE) {
        onSelectFile(file);
      }
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📁';
  };

  if (!isOpen) return null;

  const activeTransfers = transfers.filter(t => t.status === 'transferring' || t.status === 'paused');
  const completedTransfers = transfers.filter(t => t.status === 'completed');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0e14] border border-cyan-900/30 rounded-xl shadow-2xl w-full max-w-lg font-mono">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] rounded-xl" 
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,0,0.02) 1px, rgba(0,255,0,0.02) 2px)'
          }} 
        />

        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
              <Upload className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">P2P File Transfer</h3>
              <p className="text-[10px] text-slate-500">Up to 1GB • End-to-end encrypted</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800"
            data-testid="button-close-file-transfer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              dragActive
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/30"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="file-drop-zone"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
            <HardDrive className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-1">
              {dragActive ? "Drop file here" : "Drag & drop or click to select"}
            </p>
            <p className="text-[10px] text-slate-600">Maximum file size: 1GB</p>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/30 rounded-lg text-[10px]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Shield className="h-3 w-3" />
              <span>E2E Encrypted</span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Zap className="h-3 w-3" />
              <span>Direct P2P</span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="text-violet-400">Resumable</div>
          </div>

          {activeTransfers.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 tracking-widest">ACTIVE TRANSFERS</p>
              {activeTransfers.map(transfer => {
                const bytesTransferred = transfer.bytesTransferred || (transfer.fileSize * transfer.progress / 100);
                const bytesRemaining = transfer.fileSize - bytesTransferred;
                const isOutgoing = transfer.senderId === currentUserId;
                
                return (
                  <div
                    key={transfer.id}
                    className="bg-[#0d1117] border border-cyan-900/30 rounded-lg p-3"
                    data-testid={`transfer-${transfer.id}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{getFileIcon(transfer.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{transfer.fileName}</p>
                        <p className="text-[10px] text-slate-500">
                          {formatFileSize(bytesTransferred)} / {formatFileSize(transfer.fileSize)}
                          {transfer.speed && ` • ${formatSpeed(transfer.speed)}`}
                          {transfer.speed && ` • ETA: ${formatETA(bytesRemaining, transfer.speed)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {isOutgoing && (
                          <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                            SENDING
                          </span>
                        )}
                        {!isOutgoing && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            RECEIVING
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Progress 
                      value={transfer.progress} 
                      className="h-1.5 bg-slate-800"
                    />
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500">{Math.round(transfer.progress)}%</span>
                      <div className="flex items-center gap-1">
                        {transfer.status === 'transferring' ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onPauseTransfer(transfer.id)}
                            className="h-6 w-6 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onResumeTransfer(transfer.id)}
                            className="h-6 w-6 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onCancelTransfer(transfer.id)}
                          className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {completedTransfers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 tracking-widest">COMPLETED</p>
              {completedTransfers.slice(-3).map(transfer => (
                <div
                  key={transfer.id}
                  className="flex items-center gap-3 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-slate-300 truncate flex-1">{transfer.fileName}</span>
                  <span className="text-[10px] text-slate-500">{formatFileSize(transfer.fileSize)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useChunkedFileTransfer() {
  const [transfers, setTransfers] = useState<Map<string, FileTransfer>>(new Map());

  const startTransfer = useCallback((file: File, sendChunk: (chunk: ArrayBuffer, index: number, total: number) => void) => {
    const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    const transfer: FileTransfer = {
      id: transferId,
      senderId: '',
      senderName: '',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 0,
      status: 'transferring',
      chunks: totalChunks,
      currentChunk: 0,
      bytesTransferred: 0,
      speed: 0
    };

    setTransfers(prev => new Map(prev).set(transferId, transfer));

    let currentChunk = 0;
    let lastTime = Date.now();
    let lastBytes = 0;

    const sendNextChunk = async () => {
      if (currentChunk >= totalChunks) {
        setTransfers(prev => {
          const newMap = new Map(prev);
          const t = newMap.get(transferId);
          if (t) {
            t.status = 'completed';
            t.progress = 100;
          }
          return newMap;
        });
        return;
      }

      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = await file.slice(start, end).arrayBuffer();

      sendChunk(chunk, currentChunk, totalChunks);
      
      currentChunk++;
      const bytesTransferred = currentChunk * CHUNK_SIZE;
      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000;
      const bytesDiff = bytesTransferred - lastBytes;
      const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

      lastTime = now;
      lastBytes = bytesTransferred;

      setTransfers(prev => {
        const newMap = new Map(prev);
        const t = newMap.get(transferId);
        if (t) {
          t.currentChunk = currentChunk;
          t.progress = (currentChunk / totalChunks) * 100;
          t.bytesTransferred = bytesTransferred;
          t.speed = speed;
        }
        return newMap;
      });

      setTimeout(sendNextChunk, 10);
    };

    sendNextChunk();
    return transferId;
  }, []);

  return {
    transfers: Array.from(transfers.values()),
    startTransfer
  };
}

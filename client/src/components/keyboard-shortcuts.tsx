import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'M'], action: 'Toggle Microphone' },
  { keys: ['Ctrl', 'E'], action: 'Toggle Camera' },
  { keys: ['Ctrl', 'D'], action: 'Toggle Screen Share' },
  { keys: ['Ctrl', 'P'], action: 'Toggle Participants' },
  { keys: ['Ctrl', 'B'], action: 'Toggle Chat' },
  { keys: ['Ctrl', 'W'], action: 'Toggle Whiteboard' },
  { keys: ['Ctrl', 'S'], action: 'Security Console' },
  { keys: ['Ctrl', 'N'], action: 'Network Topology' },
  { keys: ['Ctrl', 'K'], action: 'Keyboard Shortcuts' },
  { keys: ['Ctrl', 'L'], action: 'Leave Meeting' },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Keyboard className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-semibold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Quick access controls</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-700 text-slate-400"
            data-testid="button-close-shortcuts"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-cyan-500/30 transition-colors"
            >
              <span className="text-sm text-slate-300">{shortcut.action}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i}>
                    <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-cyan-400 font-mono shadow-sm">
                      {key}
                    </kbd>
                    {i < shortcut.keys.length - 1 && (
                      <span className="text-slate-600 mx-1">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-cyan-500/20 bg-slate-800/30">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-400 font-mono">?</kbd>
            <span>anytime to show this menu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts({
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleParticipants,
  onToggleChat,
  onToggleWhiteboard,
  onToggleConsole,
  onToggleTopology,
  onToggleShortcuts,
  onLeave,
}: {
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onToggleWhiteboard: () => void;
  onToggleConsole: () => void;
  onToggleTopology: () => void;
  onToggleShortcuts: () => void;
  onLeave: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'm':
            e.preventDefault();
            onToggleMic();
            break;
          case 'e':
            e.preventDefault();
            onToggleCamera();
            break;
          case 'd':
            e.preventDefault();
            onToggleScreenShare();
            break;
          case 'p':
            e.preventDefault();
            onToggleParticipants();
            break;
          case 'b':
            e.preventDefault();
            onToggleChat();
            break;
          case 'w':
            e.preventDefault();
            onToggleWhiteboard();
            break;
          case 's':
            e.preventDefault();
            onToggleConsole();
            break;
          case 'n':
            e.preventDefault();
            onToggleTopology();
            break;
          case 'k':
            e.preventDefault();
            onToggleShortcuts();
            break;
          case 'l':
            e.preventDefault();
            onLeave();
            break;
        }
      }
      if (e.key === '?') {
        onToggleShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleMic, onToggleCamera, onToggleScreenShare, onToggleParticipants, onToggleChat, onToggleWhiteboard, onToggleConsole, onToggleTopology, onToggleShortcuts, onLeave]);
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, Columns, SplitSquareVertical, 
  Monitor, MessageSquare, PenTool, Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LayoutMode } from "@shared/schema";

interface DualScreenLayoutProps {
  currentLayout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
  hasWhiteboard: boolean;
  hasChat: boolean;
}

export function DualScreenLayoutSelector({
  currentLayout,
  onLayoutChange,
  hasWhiteboard,
  hasChat
}: DualScreenLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  const layouts = [
    {
      id: 'grid' as LayoutMode,
      name: 'Grid View',
      icon: LayoutGrid,
      description: 'Equal tiles for all participants'
    },
    {
      id: 'presenter-whiteboard' as LayoutMode,
      name: 'Presenter + Whiteboard',
      icon: SplitSquareVertical,
      description: 'Large presenter left, whiteboard right',
      requiresWhiteboard: true
    },
    {
      id: 'chat-whiteboard' as LayoutMode,
      name: 'Chat + Whiteboard',
      icon: Columns,
      description: 'Chat panel left, whiteboard right',
      requiresWhiteboard: true,
      requiresChat: true
    },
    {
      id: 'focus' as LayoutMode,
      name: 'Focus Mode',
      icon: Maximize2,
      description: 'Single speaker maximized'
    }
  ];

  const availableLayouts = layouts.filter(l => {
    if (l.requiresWhiteboard && !hasWhiteboard) return false;
    if (l.requiresChat && !hasChat) return false;
    return true;
  });

  const currentLayoutInfo = layouts.find(l => l.id === currentLayout);

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg"
        data-testid="button-layout-selector"
      >
        {currentLayoutInfo && <currentLayoutInfo.icon className="h-4 w-4" />}
        <span className="text-xs hidden sm:inline">{currentLayoutInfo?.name || 'Layout'}</span>
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-[#0a0e14] border border-cyan-900/30 rounded-lg shadow-2xl z-50 font-mono overflow-hidden">
            <div className="px-3 py-2 border-b border-cyan-900/40 bg-[#0d1117]">
              <p className="text-[10px] text-cyan-400 tracking-widest">LAYOUT_MODE</p>
            </div>
            <div className="p-2 space-y-1">
              {availableLayouts.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => { onLayoutChange(layout.id); setIsOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded transition-all text-left",
                    currentLayout === layout.id
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                      : "hover:bg-slate-800/50 text-slate-400 hover:text-white border border-transparent"
                  )}
                  data-testid={`layout-${layout.id}`}
                >
                  <layout.icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{layout.name}</p>
                    <p className="text-[10px] text-slate-600 truncate">{layout.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface DualScreenContainerProps {
  layout: LayoutMode;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  className?: string;
}

export function DualScreenContainer({
  layout,
  leftContent,
  rightContent,
  className
}: DualScreenContainerProps) {
  if (layout === 'grid' || layout === 'focus') {
    return <>{leftContent}</>;
  }

  return (
    <div className={cn("flex h-full gap-3", className)}>
      <div className="flex-1 min-w-0">
        {leftContent}
      </div>
      <div className="w-1/2 min-w-[300px] max-w-[600px]">
        {rightContent}
      </div>
    </div>
  );
}

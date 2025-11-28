import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface LightweightModeProps {
  className?: string;
}

export function LightweightModeToggle({ className }: LightweightModeProps) {
  const [isLightweight, setIsLightweight] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aricameet-lightweight') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isLightweight) {
      document.documentElement.classList.add('lightweight-mode');
      document.documentElement.classList.add('reduce-motion');
      localStorage.setItem('aricameet-lightweight', 'true');
    } else {
      document.documentElement.classList.remove('lightweight-mode');
      document.documentElement.classList.remove('reduce-motion');
      localStorage.setItem('aricameet-lightweight', 'false');
    }
  }, [isLightweight]);

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setIsLightweight(!isLightweight)}
      className={cn(
        "h-8 w-8 rounded-lg transition-all",
        isLightweight 
          ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" 
          : "text-slate-400 hover:text-white hover:bg-slate-800/50",
        className
      )}
      title={isLightweight ? "Performance mode ON" : "Performance mode OFF"}
      data-testid="button-lightweight-mode"
    >
      {isLightweight ? (
        <Zap className="h-4 w-4" />
      ) : (
        <ZapOff className="h-4 w-4" />
      )}
    </Button>
  );
}

export function useLightweightMode() {
  const [isLightweight, setIsLightweight] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aricameet-lightweight') === 'true';
    }
    return false;
  });

  const toggle = () => {
    const newValue = !isLightweight;
    setIsLightweight(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('lightweight-mode');
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('lightweight-mode');
      document.documentElement.classList.remove('reduce-motion');
    }
    
    localStorage.setItem('aricameet-lightweight', String(newValue));
  };

  return { isLightweight, toggle };
}

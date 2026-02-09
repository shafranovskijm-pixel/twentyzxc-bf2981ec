import { Monitor, Tablet, Smartphone, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DeviceType = "desktop" | "tablet" | "mobile";

interface DeviceSwitcherProps {
  currentDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  onFullscreen?: () => void;
  className?: string;
}

const devices = [
  { id: "desktop" as const, icon: Monitor, label: "Desktop", width: "100%" },
  { id: "tablet" as const, icon: Tablet, label: "Tablet", width: "768px" },
  { id: "mobile" as const, icon: Smartphone, label: "Mobile", width: "375px" },
];

export const DeviceSwitcher = ({ 
  currentDevice, 
  onDeviceChange, 
  onFullscreen,
  className 
}: DeviceSwitcherProps) => {
  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-white/10 backdrop-blur-sm", className)}>
      {devices.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          size="sm"
          variant="ghost"
          onClick={() => onDeviceChange(id)}
          className={cn(
            "h-8 w-8 p-0 transition-all",
            currentDevice === id 
              ? "bg-primary text-primary-foreground" 
              : "text-white/60 hover:text-white hover:bg-white/10"
          )}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
      {onFullscreen && (
        <>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onFullscreen}
            className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export const getDeviceWidth = (device: DeviceType): string => {
  switch (device) {
    case "mobile": return "375px";
    case "tablet": return "768px";
    case "desktop": return "100%";
  }
};

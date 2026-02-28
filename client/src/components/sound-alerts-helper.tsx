import { useState } from "react";
import { Volume2, VolumeX, Play, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  playNotificationSound, 
  getVolume, 
  setVolume, 
  unlockMobileAudio,
  isAudioUnlocked 
} from "@/lib/notification-sounds";

const ALERTS = [
  { id: "new_order", label: "New Order" },
  { id: "order_assigned", label: "Order Assigned" },
  { id: "bid_accepted", label: "Bid Accepted" },
  { id: "bid_denied", label: "Bid Denied" },
  { id: "strike", label: "Strike Received" },
  { id: "payout", label: "Payout Processed" },
  { id: "message", label: "New Message" },
  { id: "alert", label: "System Alert" },
  { id: "info", label: "General Info" },
];

export function SoundAlertsHelper() {
  const [volume, setVolumeState] = useState(getVolume() * 100);
  const [unlocked, setUnlocked] = useState(isAudioUnlocked());

  const handleVolumeChange = (value: number[]) => {
    const newVol = value[0];
    setVolumeState(newVol);
    setVolume(newVol / 100);
  };

  const handleUnlock = () => {
    unlockMobileAudio();
    setUnlocked(true);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover-elevate hover:bg-white/10"
          data-testid="button-sound-alerts"
        >
          {volume === 0 ? (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Volume2 className="w-5 h-5 text-muted-foreground" />
          )}
          {!unlocked && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Sound Alerts</h4>
            </div>
            {!unlocked && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-[10px] px-2 border-primary/30 text-primary hover:bg-primary/10"
                onClick={handleUnlock}
              >
                Enable Audio
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Volume</span>
              <span>{Math.round(volume)}%</span>
            </div>
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {ALERTS.map((alert) => (
              <Button
                key={alert.id}
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-8 text-[11px] border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
                onClick={() => playNotificationSound(alert.id)}
              >
                <Play className="w-3 h-3 text-primary group-hover:scale-110 transition-transform" />
                <span className="truncate">{alert.label}</span>
              </Button>
            ))}
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground italic">
            Tap a sound to test. Sounds play automatically for events.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

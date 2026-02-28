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
  setVolume 
} from "@/lib/notification-sounds";

const ALERTS = [
  { id: "new_order", label: "New Order", desc: "Urgent double-beep" },
  { id: "emergency_order", label: "Emergency Order", desc: "Siren alert" },
  { id: "order_assigned", label: "Order Assigned", desc: "Success fanfare" },
  { id: "order_update", label: "Order Update", desc: "Soft chime" },
  { id: "bid_accepted", label: "Bid Accepted", desc: "Ascending confirm" },
  { id: "bid_denied", label: "Bid Denied", desc: "Descending buzz" },
  { id: "strike", label: "Strike Received", desc: "Heavy warning" },
  { id: "payout", label: "Payout / Income", desc: "Cash register" },
  { id: "message", label: "New Message", desc: "Bubble pop" },
  { id: "alert", label: "System Alert", desc: "Alarm beep" },
  { id: "info", label: "General Info", desc: "Gentle ding" },
];

export function SoundAlertsHelper() {
  const [volume, setVolumeState] = useState(getVolume() * 100);
  const [playing, setPlaying] = useState<string | null>(null);

  const handleVolumeChange = (value: number[]) => {
    const newVol = value[0];
    setVolumeState(newVol);
    setVolume(newVol / 100);
  };

  const handlePlay = (id: string) => {
    setPlaying(id);
    playNotificationSound(id);
    setTimeout(() => setPlaying(null), 1200);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover-elevate hover:bg-white/10 hidden md:flex"
          data-testid="button-sound-alerts"
        >
          {volume === 0 ? (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Volume2 className="w-5 h-5 text-muted-foreground" />
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
          </div>

          <div className="space-y-2 md:block hidden">
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

          <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
            {ALERTS.map((alert) => (
              <Button
                key={alert.id}
                variant="outline"
                size="sm"
                className={`w-full justify-between h-9 text-[11px] border-white/5 bg-white/5 hover:bg-white/10 transition-all group ${playing === alert.id ? "border-primary/40 bg-primary/10" : ""}`}
                onClick={() => handlePlay(alert.id)}
                data-testid={`button-play-${alert.id}`}
              >
                <div className="flex items-center gap-2">
                  <Play className={`w-3 h-3 text-primary shrink-0 transition-transform ${playing === alert.id ? "scale-125" : "group-hover:scale-110"}`} />
                  <span className="truncate">{alert.label}</span>
                </div>
                <span className="text-[9px] text-muted-foreground/70 ml-2 truncate">{alert.desc}</span>
              </Button>
            ))}
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground italic">
            Each alert has a unique sound tailored to its type.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

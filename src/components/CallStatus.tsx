import { useEffect, useState } from "react";
import type { PhoneState } from "@/services/sipService";
import { toast } from "sonner";

interface CallStatusProps {
  state: PhoneState;
  callerId: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStatusDotClass(state: PhoneState): string {
  switch (state) {
    case "registered":
      return "online";
    case "connecting":
      return "connecting";
    case "in-call":
    case "calling":
    case "ringing":
      return "in-call";
    default:
      return "offline";
  }
}

function getStatusText(state: PhoneState): string {
  switch (state) {
    case "disconnected":
      return "Offline";
    case "connecting":
      return "Connecting...";
    case "registered":
      return "Ready";
    case "ringing":
      toast("Incoming call");
      return "Incoming Call";
    case "calling":
      return "Calling...";
    case "in-call":
      return "In Call";
    default:
      return "Unknown";
  }
}

export function CallStatus({ state, callerId }: CallStatusProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (state === "in-call") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDuration(0);
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [state]);

  const showCallInfo = state === "ringing" || state === "calling" || state === "in-call";

  return (
    <div className="text-center py-4">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`status-dot ${getStatusDotClass(state)}`} />
        <span className="text-sm text-muted-foreground">
          {getStatusText(state)}
        </span>
      </div>

      {showCallInfo && (
        <div className="space-y-2">
          <div className="font-display text-xl text-foreground">
            {callerId || "Unknown"}
          </div>
          {state === "in-call" && (
            <div className="font-display text-lg text-primary tabular-nums">
              {formatDuration(duration)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

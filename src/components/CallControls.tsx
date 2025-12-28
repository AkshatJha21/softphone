import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming } from "lucide-react";
import type { PhoneState } from "@/services/sipService";

interface CallControlsProps {
  state: PhoneState;
  isMuted: boolean;
  onCall: () => void;
  onAnswer: () => void;
  onHangup: () => void;
  onMute: () => void;
  callDisabled?: boolean;
}

export function CallControls({
  state,
  isMuted,
  onCall,
  onAnswer,
  onHangup,
  onMute,
  callDisabled = false,
}: CallControlsProps) {
  const renderControls = () => {
    switch (state) {
      case "registered":
      case "disconnected":
        return (
          <div className="flex justify-center">
            <button
              className={`call-btn call-btn-answer ${
                callDisabled || state === "disconnected"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={onCall}
              disabled={callDisabled || state === "disconnected"}
              aria-label="Make call"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        );

      case "ringing":
        return (
          <div className="flex justify-center gap-8">
            <button
              className="call-btn call-btn-hangup"
              onClick={onHangup}
              aria-label="Reject call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              className="call-btn call-btn-answer ringing"
              onClick={onAnswer}
              aria-label="Answer call"
            >
              <PhoneIncoming className="w-6 h-6" />
            </button>
          </div>
        );

      case "calling":
      case "in-call":
        return (
          <div className="flex justify-center gap-6">
            <button
              className={`call-btn call-btn-mute ${isMuted ? "active" : ""}`}
              onClick={onMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            <button
              className="call-btn call-btn-hangup"
              onClick={onHangup}
              aria-label="Hang up"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        );

      case "connecting":
        return (
          <div className="flex justify-center">
            <button
              className="call-btn call-btn-answer opacity-50 cursor-not-allowed"
              disabled
              aria-label="Connecting..."
            >
              <Phone className="w-6 h-6 animate-pulse" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="py-4">{renderControls()}</div>;
}

import { useState, useEffect, useCallback } from "react";
import { sipService, type PhoneState, type SipCredentials } from "@/services/sipService";
import { Dialpad } from "./Dialpad";
import { CallControls } from "./CallControls";
import { CallStatus } from "./CallStatus";
import { PhoneDisplay } from "./PhoneDisplay";
import { SettingsPanel } from "./SettingsPanel";
import { toast } from "sonner";

export function Softphone() {
  const [phoneState, setPhoneState] = useState<PhoneState>("disconnected");
  const [dialedNumber, setDialedNumber] = useState("");
  const [callerId, setCallerId] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  // ==================== INITIALIZE SIP SERVICE ====================
  
  useEffect(() => {
    sipService.initialize({
      onStateChange: (state) => {
        setPhoneState(state);
        
        if (state === "ringing") {
          // add a ringtone here
        }
      },
      onCallerId: (id) => {
        setCallerId(id);
      },
      onError: (error) => {
        console.log(error)
      },
    });

    return () => {
      sipService.unregister();
    };
  }, []);

  // ==================== HANDLERS ====================

  const handleConnect = useCallback(async (credentials: SipCredentials) => {
    try {
      await sipService.register(credentials);
      toast.success("Connected to server");
      console.log({
        title: "Connected",
        description: "Successfully registered with SIP server",
      });
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed");
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await sipService.unregister();
    toast.success("Disconnected from server");
    console.log({
      title: "Disconnected",
      description: "Disconnected from SIP server",
    });
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      if (phoneState === "in-call") {
        sipService.sendDTMF(digit);
        // Optional: show feedback that tone was sent
        toast.success(`DTMF: ${digit}`);
        console.log({
          title: `DTMF: ${digit}`,
          duration: 500,
        });
      } else {
        setDialedNumber((prev) => prev + digit);
      }
    },
    [phoneState]
  );

  const handleBackspace = useCallback(() => {
    setDialedNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(async () => {
    if (!dialedNumber) {
      toast('Enter a number');
      console.log({
        title: "Enter a number",
        description: "Please enter a phone number or SIP address",
        variant: "destructive",
      });
      return;
    }

    try {
      await sipService.call(dialedNumber);
      setDialedNumber("");
    } catch (error) {
      console.error("Call failed:", error);
      toast.error('Call failed');
      console.log({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Failed to make call",
        variant: "destructive",
      });
    }
  }, [dialedNumber]);

  const handleAnswer = useCallback(async () => {
    try {
      await sipService.answer();
    } catch (error) {
      console.error("Answer failed:", error);
    }
  }, []);

  const handleHangup = useCallback(async () => {
    await sipService.hangup();
    setIsMuted(false);
  }, []);

  const handleMute = useCallback(() => {
    const newMuteState = sipService.toggleMute();
    setIsMuted(newMuteState);
  }, []);

  // ==================== RENDER ====================

  const isCallActive = phoneState === "calling" || phoneState === "in-call" || phoneState === "ringing";
  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <SettingsPanel
        state={phoneState}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      <div className="phone-container rounded-2xl overflow-hidden">
        <CallStatus state={phoneState} callerId={callerId} />
        {!isCallActive && (
          <PhoneDisplay
            number={dialedNumber}
            onBackspace={handleBackspace}
            disabled={phoneState === "disconnected"}
          />
        )}
        <Dialpad
          onDigit={handleDigit}
          disabled={phoneState === "disconnected" || phoneState === "connecting"}
        />
        <CallControls
          state={phoneState}
          isMuted={isMuted}
          onCall={handleCall}
          onAnswer={handleAnswer}
          onHangup={handleHangup}
          onMute={handleMute}
          callDisabled={!dialedNumber}
        />
      </div>
    </div>
  );
}

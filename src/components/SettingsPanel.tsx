import React, { useState } from "react";
import { Settings, ChevronDown, ChevronUp, Wifi, WifiOff } from "lucide-react";
import type { SipCredentials, PhoneState } from "@/services/sipService";

interface SettingsPanelProps {
  state: PhoneState;
  onConnect: (credentials: SipCredentials) => void;
  onDisconnect: () => void;
}

const DEFAULT_CREDENTIALS: SipCredentials = {
  username: "",
  password: "",
  domain: "localhost",
  wsServer: "ws:/localhost:8088/ws",
};

export function SettingsPanel({
  state,
  onConnect,
  onDisconnect,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [credentials, setCredentials] = useState<SipCredentials>(DEFAULT_CREDENTIALS);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password || !credentials.domain || !credentials.wsServer) {
      alert("Please fill in all fields");
      return;
    }
    onConnect(credentials);
  };

  const isConnected = state !== "disconnected" && state !== "connecting";

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-white" />
          <span className="font-medium text-white">SIP Settings</span>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </div>
      </button>

      {isOpen && (
        <form onSubmit={handleConnect} className="p-4 pt-0 space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm text-muted-foreground">
              SIP Username
            </label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              placeholder="e.g., 1001 or user"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isConnected}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-muted-foreground">
              SIP Password
            </label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              placeholder="Your SIP password"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isConnected}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="domain" className="text-sm text-muted-foreground">
              SIP Domain
            </label>
            <input
              id="domain"
              type="text"
              value={credentials.domain}
              onChange={(e) =>
                setCredentials({ ...credentials, domain: e.target.value })
              }
              placeholder="e.g., sip.provider.com"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isConnected}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="wsServer" className="text-sm text-muted-foreground">
              WebSocket Server
            </label>
            <input
              id="wsServer"
              type="text"
              value={credentials.wsServer}
              onChange={(e) =>
                setCredentials({ ...credentials, wsServer: e.target.value })
              }
              placeholder="e.g., wss://sip.provider.com:8089/ws"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isConnected}
            />
          </div>

          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="w-full py-2 px-4 bg-destructive text-white rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="submit"
              disabled={state === "connecting"}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              {state === "connecting" ? "Connecting..." : "Connect"}
            </button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Works with Asterisk, FreeSWITCH, or any WebRTC-enabled SIP provider
          </p>
        </form>
      )}
    </div>
  );
}

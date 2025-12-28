/**
 * SIP Service - Handles all SIP/VoIP communication using SIP.js
 * 
 * This service wraps the SIP.js library to provide a simple API for:
 * - Registering with a SIP server
 * - Making outbound calls
 * - Receiving inbound calls
 * - Call control (hangup, mute, DTMF)
 * 
 * HOW IT WORKS:
 * 1. UserAgent: The main SIP.js object that represents your phone
 * 2. Registerer: Tells the SIP server "I'm online, send calls to me"
 * 3. Inviter: Used to make outbound calls
 * 4. Session: Represents an active call (inbound or outbound)
 */

import {
  UserAgent,
  Registerer,
  RegistererState,
  Inviter,
  SessionState,
  Session,
  Invitation,
  type UserAgentOptions
} from "sip.js";

type WebRTCSDH = {
  peerConnection: RTCPeerConnection;
};

export interface SipCredentials {
  username: string;
  password: string;
  domain: string;
  wsServer: string;
}

export type PhoneState = 
  | "disconnected"  
  | "connecting"    
  | "registered"   
  | "ringing"        
  | "calling"        
  | "in-call";


export interface SipCallbacks {
  onStateChange: (state: PhoneState) => void;
  onCallerId: (callerId: string) => void;
  onError: (error: string) => void;
}


class SipService {
  private userAgent: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private currentSession: Session | null = null;
  private callbacks: SipCallbacks | null = null;
  private isMuted: boolean = false;
  private remoteAudio: HTMLAudioElement | null = null;

  initialize(callbacks: SipCallbacks) {
    this.callbacks = callbacks;
    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
  }

  async register(credentials: SipCredentials): Promise<void> {
    this.callbacks?.onStateChange("connecting");
    try {
      const uri = UserAgent.makeURI(`sip:${credentials.username}@${credentials.domain}`);
      if (!uri) {
        throw new Error("Invalid SIP URI - check your username and domain");
      }
      const userAgentOptions: UserAgentOptions = {
        uri,
        transportOptions: {
          server: credentials.wsServer,
        },
        authorizationUsername: credentials.username,
        authorizationPassword: credentials.password,
        delegate: {
          onInvite: (invitation: Invitation) => {
            this.handleIncomingCall(invitation)},
        },
        logLevel: "debug",
      };
      this.userAgent = new UserAgent(userAgentOptions);
      await this.userAgent.start();
      this.registerer = new Registerer(this.userAgent);
      this.registerer.stateChange.addListener((state: RegistererState) => {
        switch (state) {
          case RegistererState.Registered:
            this.callbacks?.onStateChange("registered");
            break;
          case RegistererState.Unregistered:
            this.callbacks?.onStateChange("disconnected");
            break;
        }
      });
      await this.registerer.register();

    } catch (error) {
      this.callbacks?.onStateChange("disconnected");
      this.callbacks?.onError(
        error instanceof Error ? error.message : "Failed to register with SIP server"
      );
      throw error;
    }
  }

  async unregister(): Promise<void> {
    try {
      if (this.currentSession) {
        await this.hangup();
      }
      if (this.registerer) {
        await this.registerer.unregister();
      }
      if (this.userAgent) {
        await this.userAgent.stop();
        this.userAgent = null;
      }
      this.callbacks?.onStateChange("disconnected");
    } catch (e) {
      console.error(e);
      this.callbacks?.onError("Failed to disconnect cleanly");
    }
  }
  async call(destination: string): Promise<void> {
    if (!this.userAgent) {
      throw new Error("Not connected - please register first");
    }
    const domain = this.userAgent.configuration.uri.host;
    const targetUri = destination.includes("@")
      ? `sip:${destination}`
      : `sip:${destination}@${domain}`;
    const target = UserAgent.makeURI(targetUri);
    if (!target) {
      throw new Error("Invalid destination number");
    }

    const inviter = new Inviter(this.userAgent, target, {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false,
        },
      },
    });

    this.currentSession = inviter;
    this.callbacks?.onStateChange("calling");
    this.callbacks?.onCallerId(destination);
    this.setupSessionHandlers(inviter);

    try {
      await inviter.invite();
    } catch (error) {
      this.currentSession = null;
      this.callbacks?.onStateChange("registered");
      throw error;
    }
  }

  async answer(): Promise<void> {
    if (!this.currentSession || !(this.currentSession instanceof Invitation)) {
      throw new Error("No incoming call to answer");
    }

    try {
      await (this.currentSession as Invitation).accept({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      });
    } catch (error) {
      this.callbacks?.onError("Failed to answer call");
      throw error;
    }
  }

  async hangup(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      const state = this.currentSession.state;
      
      if (state === SessionState.Establishing || state === SessionState.Established) {
        await this.currentSession.bye();
      } else if (this.currentSession instanceof Invitation) {
        await (this.currentSession as Invitation).reject();
      } else if (this.currentSession instanceof Inviter) {
        await (this.currentSession as Inviter).cancel();
      }
    } catch (error) {
      console.log("Hangup error (usually safe to ignore):", error);
    } finally {
      this.currentSession = null;
      this.isMuted = false;
      this.callbacks?.onStateChange("registered");
      this.callbacks?.onCallerId("");
    }
  }

  toggleMute(): boolean {
  if (!this.currentSession) return false;
  this.isMuted = !this.isMuted;
  const sdh = this.currentSession.sessionDescriptionHandler;
  if (!sdh) return this.isMuted;
  const pc = (sdh as unknown as WebRTCSDH).peerConnection;
  if (!pc) return this.isMuted;
  pc.getSenders().forEach((sender: RTCRtpSender) => {
    if (sender.track?.kind === "audio") {
      sender.track.enabled = !this.isMuted;
    }
  });
  return this.isMuted;
}

  getMuteState(): boolean {
    return this.isMuted;
  }

  sendDTMF(digit: string): void {
    if (!this.currentSession) {
      return;
    }

    if (!/^[0-9*#]$/.test(digit)) {
      console.warn("Invalid DTMF digit:", digit);
      return;
    }

    try {
      const options = {
        requestOptions: {
          body: {
            contentDisposition: "render",
            contentType: "application/dtmf-relay",
            content: `Signal=${digit}\r\nDuration=100`,
          },
        },
      };
      
      this.currentSession.info(options);
    } catch (error) {
      console.error("Failed to send DTMF:", error);
    }
  }

  private handleIncomingCall(invitation: Invitation): void {
    this.currentSession = invitation;
    const fromHeader = invitation.request.from;
    const callerId = fromHeader?.uri?.user || "Unknown";
    this.callbacks?.onStateChange("ringing");
    this.callbacks?.onCallerId(callerId);
    this.setupSessionHandlers(invitation);
  }

  private setupSessionHandlers(session: Session): void {
    session.stateChange.addListener((state: SessionState) => {
      switch (state) {
        case SessionState.Establishing:
          if (session instanceof Inviter) {
            this.callbacks?.onStateChange("calling");
          }
          break;
          
        case SessionState.Established:
          this.callbacks?.onStateChange("in-call");
          this.setupRemoteAudio(session);
          break;
          
        case SessionState.Terminated:
          this.currentSession = null;
          this.isMuted = false;
          this.callbacks?.onStateChange("registered");
          this.callbacks?.onCallerId("");
          break;
      }
    });
  }

  private setupRemoteAudio(session: Session): void {
  const sdh = session.sessionDescriptionHandler;
  if (!sdh || !this.remoteAudio) return;

  const pc = (sdh as unknown as WebRTCSDH).peerConnection;
  if (!pc) return;

  const remoteStream = new MediaStream();

  pc.getReceivers().forEach((receiver: RTCRtpReceiver) => {
    if (receiver.track?.kind === "audio") {
      remoteStream.addTrack(receiver.track);
    }
  });

  this.remoteAudio.srcObject = remoteStream;
  this.remoteAudio.play().catch(console.error);
}

  isInCall(): boolean {
    return this.currentSession !== null;
  }
}

export const sipService = new SipService();

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let newSocket: Socket | null = null;

    const connectSocket = () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.log("⚪ Socket: no authentication token");
        return;
      }

      // Prevent duplicate connections
      if (newSocket?.connected) {
        return;
      }

      console.log("🔌 Creating central socket...");

      newSocket = io(SOCKET_URL, {
        auth: {
          token,
        },

        transports: ["websocket"],

        autoConnect: true,

        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,

        timeout: 20000,
      });

      const handleConnect = () => {
        console.log("🟢 CENTRAL SOCKET CONNECTED:", newSocket?.id);
        setConnected(true);
      };

      const handleDisconnect = (reason: string) => {
        console.log("🔴 CENTRAL SOCKET DISCONNECTED:", reason);
        setConnected(false);
      };

      const handleConnectError = (error: Error) => {
        console.error("❌ CENTRAL SOCKET CONNECTION ERROR:", error.message);

        setConnected(false);
      };

      newSocket.on("connect", handleConnect);
      newSocket.on("disconnect", handleDisconnect);
      newSocket.on("connect_error", handleConnectError);

      setSocket(newSocket);
    };

    /*
     * Initial connection
     */
    connectSocket();

    /*
     * Login/logout can happen after the provider
     * has already mounted.
     *
     * Dispatch this event after login.
     */
    const handleAuthChanged = () => {
      console.log("🔄 Socket authentication changed");

      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
        newSocket = null;

        setSocket(null);
        setConnected(false);
      }

      connectSocket();
    };

    window.addEventListener("auth-changed", handleAuthChanged);

    /*
     * Browser tab comes back from sleep/background.
     */
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        newSocket &&
        !newSocket.connected
      ) {
        console.log("🔄 Reconnecting central socket...");
        newSocket.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChanged);

      document.removeEventListener("visibilitychange", handleVisibility);

      if (newSocket) {
        console.log("🔌 Closing central socket");

        newSocket.removeAllListeners();
        newSocket.disconnect();
        newSocket = null;
      }

      setSocket(null);
      setConnected(false);
    };
  }, []);

  const value = useMemo(
    () => ({
      socket,
      connected,
    }),
    [socket, connected],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

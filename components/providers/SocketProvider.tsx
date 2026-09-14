"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
  reconnect: () => void;
  disconnect: () => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected || socketRef.current) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const instance = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = instance;
    setSocket(instance);

    instance.on("connect", () => {
      setConnected(true);
      console.log("🟢 Central socket connected:", instance.id);
    });

    instance.on("disconnect", (reason) => {
      setConnected(false);
      console.log("🔴 Central socket disconnected:", reason);
    });

    instance.on("connect_error", (error) => {
      setConnected(false);
      console.error("🔴 Central socket error:", error.message);
    });
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    connect();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (!socketRef.current) {
          connect();
        } else if (!socketRef.current.connected) {
          socketRef.current.connect();
        }
      }
    };

    const handleAuthChanged = () => {
      reconnect();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("auth-changed", handleAuthChanged);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect, reconnect]);

  const value = useMemo(
    () => ({ socket, connected, reconnect, disconnect }),
    [socket, connected, reconnect, disconnect],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
}

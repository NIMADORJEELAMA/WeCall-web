// hooks/use-kitchen-socket.ts
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export const useKitchenSocket = (onUpdate: () => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => console.log("🟢 Kitchen Socket Connected"));

    // Listen for the specific kitchen event
    socket.on("kitchenUpdate", () => {
      onUpdate();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [onUpdate]);

  return socketRef.current;
};

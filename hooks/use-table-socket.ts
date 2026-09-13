// hooks/use-table-socket.ts
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export const useTableSocket = (
  tableId: string,
  onUpdate: (data: any) => void,
) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`🟢 Table Socket Connected: ${tableId}`);
    });

    // Listen for the specific table update
    socket.on("tableUpdated", (data) => {
      if (data.tableId === tableId) {
        onUpdate(data);
      }
    });

    // Cleanup on unmount or ID change
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [tableId, onUpdate]);

  return socketRef.current;
};

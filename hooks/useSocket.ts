// import { useEffect, useRef } from "react";
// import { io, Socket } from "socket.io-client";

// const SOCKET_URL =
//   process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

// export const useSocket = (onNewOrder: (order: any) => void) => {
//   const socketRef = useRef<Socket | null>(null);

//   useEffect(() => {
//     // 1. Initialize socket with robust options
//     const socket = io(SOCKET_URL, {
//       transports: ["websocket"], // Faster, bypasses most polling issues
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//     });

//     socketRef.current = socket;

//     socket.on("connect", () => {
//       console.log("Connected to Server ID:", socket.id);
//     });

//     socket.on("newOrder", (data) => {
//       onNewOrder(data);
//       // Play sound - note: audio objects are best initialized outside to prevent lag
//       const audio = new Audio("/Notification.mp3");
//       audio.play().catch(() => console.log("Sound blocked by browser policy"));
//     });

//     // 2. Tab Visibility Fix: If user comes back to a hibernated tab,
//     // force a check if the socket is still alive.
//     const handleVisibility = () => {
//       if (document.visibilityState === "visible" && !socket.connected) {
//         socket.connect();
//       }
//     };

//     document.addEventListener("visibilitychange", handleVisibility);

//     return () => {
//       document.removeEventListener("visibilitychange", handleVisibility);
//       socket.off("newOrder");
//       socket.disconnect();
//     };
//   }, [onNewOrder]); // Ensure onNewOrder is memoized in the parent to prevent loops
// };

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export const useSocket = (onNewOrder: (order: any) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Prevent duplicate socket connections
    if (socketRef.current) return;

    // Preload audio once (important for performance)
    audioRef.current = new Audio("/Notification.mp3");

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Connected
    socket.on("connect", () => {
      console.log("🟢 Socket Connected:", socket.id);
    });

    // Connection Error
    socket.on("connect_error", (err) => {
      console.error("🔴 Socket Error:", err.message);
    });

    // New Order Event
    socket.on("newOrder", (data) => {
      onNewOrder(data);

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch(() => console.log("🔇 Browser blocked sound"));
      }
    });

    // Tab visibility fix
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (!socket.connected) {
          console.log("🔄 Reconnecting socket...");
          socket.connect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);

      if (socketRef.current) {
        socketRef.current.off("newOrder");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [onNewOrder]);
};

"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "./../components/providers/SocketProvider";

export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket) return;

    const listener = (data: T) => handlerRef.current(data);

    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

export function useSocketEmit() {
  const { socket } = useSocket();

  return <T = unknown>(event: string, payload?: T) => {
    if (!socket?.connected) {
      console.warn(`Socket is not connected. Cannot emit: ${event}`);
      return false;
    }

    socket.emit(event, payload);
    return true;
  };
}

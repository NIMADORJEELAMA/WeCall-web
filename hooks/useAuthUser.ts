"use client";

import { useEffect, useState } from "react";

export type UserRole = "USER" | "CREATOR" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          setUser(null);
          return;
        }

        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener("auth-changed", loadUser);

    return () => {
      window.removeEventListener("auth-changed", loadUser);
    };
  }, []);

  return {
    user,
    isAuthenticated: !!user,
  };
}

"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ChatAvatarProps {
  name: string;
  image?: string | null;
  online?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ChatAvatar({
  name,
  image,
  online = false,
  size = "md",
}: ChatAvatarProps) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-14 w-14 text-lg",
  };

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center font-semibold text-white",
          sizes[size],
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>

      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}

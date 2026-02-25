import { cn } from "@/lib/utils";
import type { Platform } from "@/types";

const platformConfig: Record<Platform, { name: string; color: string; bgColor: string; icon: string }> = {
  twitter: { name: "X / Twitter", color: "text-black dark:text-white", bgColor: "bg-black dark:bg-white/10", icon: "𝕏" },
  instagram: { name: "Instagram", color: "text-pink-600", bgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400", icon: "IG" },
  linkedin: { name: "LinkedIn", color: "text-blue-700", bgColor: "bg-blue-700", icon: "in" },
};

export function PlatformIcon({ platform, size = "md", showLabel = false }: { platform: Platform; size?: "sm" | "md" | "lg"; showLabel?: boolean }) {
  const config = platformConfig[platform];
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("rounded-full flex items-center justify-center text-white font-bold", config.bgColor, sizeClasses[size])}>
        {config.icon}
      </div>
      {showLabel && <span className={cn("text-sm font-medium", config.color)}>{config.name}</span>}
    </div>
  );
}

export function getPlatformName(platform: Platform): string {
  return platformConfig[platform].name;
}

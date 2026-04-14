import fs from "fs";
import path from "path";
import type { PlatformConfig, GlobalRules, ToneProfile, Platform } from "@/types";

const configDir = path.join(process.cwd(), "config");

let platformCache: Map<Platform, PlatformConfig> | null = null;
let globalRulesCache: GlobalRules | null = null;
let toneProfileCache: Map<string, ToneProfile> | null = null;

export function getPlatformConfig(platform: Platform): PlatformConfig {
  if (!platformCache) {
    platformCache = new Map();
    const platforms: Platform[] = ["linkedin", "threads", "bluesky"];
    for (const p of platforms) {
      const filePath = path.join(configDir, "platforms", `${p}.json`);
      const raw = fs.readFileSync(filePath, "utf-8");
      platformCache.set(p, JSON.parse(raw) as PlatformConfig);
    }
  }
  const config = platformCache.get(platform);
  if (!config) {
    throw new Error(`No config found for platform: ${platform}`);
  }
  return config;
}

export function getAllPlatformConfigs(): PlatformConfig[] {
  const platforms: Platform[] = ["linkedin", "threads", "bluesky"];
  return platforms.map((p) => getPlatformConfig(p));
}

export function getGlobalRules(): GlobalRules {
  if (!globalRulesCache) {
    const filePath = path.join(configDir, "global-rules.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    globalRulesCache = JSON.parse(raw) as GlobalRules;
  }
  return globalRulesCache;
}

export function getToneProfile(name: string): ToneProfile {
  if (!toneProfileCache) {
    toneProfileCache = new Map();
    const toneDir = path.join(configDir, "tone-profiles");
    const files = fs.readdirSync(toneDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(toneDir, file), "utf-8");
      const profile = JSON.parse(raw) as ToneProfile;
      toneProfileCache.set(profile.name, profile);
    }
  }
  const profile = toneProfileCache.get(name);
  if (!profile) {
    throw new Error(`No tone profile found: ${name}`);
  }
  return profile;
}

export function getAvailableToneProfiles(): string[] {
  if (!toneProfileCache) {
    getToneProfile("default"); // force load
  }
  return Array.from(toneProfileCache!.keys());
}

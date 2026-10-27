"use client";

import { createContext, useContext } from "react";
import { isSample, sampleUrl } from "@/lib/samples";

/** Resolves an asset id to an image URL for previews. Thumbnails use the small version. */
export type AssetUrlResolver = (assetId: string, variant: "full" | "thumb") => string | undefined;

const defaultResolver: AssetUrlResolver = (id) => (isSample(id) ? sampleUrl(id) : undefined);

export const AssetUrlContext = createContext<AssetUrlResolver>(defaultResolver);

export function useAssetUrl() {
  return useContext(AssetUrlContext);
}

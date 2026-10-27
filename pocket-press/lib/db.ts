import Dexie, { type Table } from "dexie";
import type { Asset, TypePack, Zine } from "./types";

// Everything lives in the browser: zines as JSON records, photos as blobs.

export type PlaceRecord = { key: string; place: string; savedAt: string };

class PocketDB extends Dexie {
  zines!: Table<Zine, string>;
  assets!: Table<Asset, string>;
  places!: Table<PlaceRecord, string>;
  packs!: Table<TypePack, string>;

  constructor() {
    super("pocket-press");
    this.version(1).stores({
      zines: "id, updatedAt",
      assets: "id, zineId, createdAt",
      places: "key",
      packs: "id",
    });
  }
}

let instance: PocketDB | null = null;
export function db() {
  instance ??= new PocketDB();
  return instance;
}

import Dexie, { type EntityTable, type Table } from "dexie";
import type { Card, CardSide } from "../domain/card";
import type { PendingChange } from "../ports";

type PhotoKey = [cardId: string, side: CardSide];

export interface FullMeta {
  cardId: string;
  side: CardSide;
  size: number;
  lastAccess: number;
  pending: 0 | 1;
}

export class BinderDb extends Dexie {
  cards!: EntityTable<Card, "id">;
  outbox!: EntityTable<PendingChange, "cardId">;
  thumbs!: Table<{ cardId: string; side: CardSide; blob: Blob }, PhotoKey>;
  fullBlobs!: Table<{ cardId: string; side: CardSide; blob: Blob }, PhotoKey>;
  fullMeta!: Table<FullMeta, PhotoKey>;
  photoTrash!: EntityTable<{ fileId: string }, "fileId">;

  constructor(name = "the-binder") {
    super(name);
    this.version(1).stores({
      cards: "id",
      outbox: "cardId",
      thumbs: "[cardId+side]",
      fullBlobs: "[cardId+side]",
      fullMeta: "[cardId+side], lastAccess, pending",
      photoTrash: "fileId",
    });
  }
}

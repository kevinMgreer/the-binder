import type { Card } from "../domain/card";
import type { CollectionStore, PendingChange } from "../ports";
import type { BinderDb } from "./db";

export class DexieCollectionStore implements CollectionStore {
  constructor(private db: BinderDb) {}

  list() {
    return this.db.cards.toArray();
  }

  get(id: string) {
    return this.db.cards.get(id);
  }

  put(card: Card) {
    return this.putMany([card]);
  }

  putMany(cards: Card[]) {
    return this.db.transaction("rw", this.db.cards, this.db.outbox, async () => {
      await this.db.cards.bulkPut(cards);
      await this.db.outbox.bulkPut(cards.map((c) => ({ cardId: c.id, updatedAt: c.updatedAt })));
    });
  }

  async putSynced(cards: Card[]) {
    await this.db.cards.bulkPut(cards);
  }

  pending() {
    return this.db.outbox.toArray();
  }

  pendingChanges() {
    return this.db.outbox.count();
  }

  clearPending(changes: PendingChange[]) {
    return this.db.transaction("rw", this.db.outbox, async () => {
      for (const { cardId, updatedAt } of changes) {
        const row = await this.db.outbox.get(cardId);
        if (row?.updatedAt === updatedAt) await this.db.outbox.delete(cardId);
      }
    });
  }

  async getMeta(key: string) {
    return (await this.db.meta.get(key))?.value;
  }

  async setMeta(key: string, value: string) {
    await this.db.meta.put({ key, value });
  }

  async clear() {
    await Promise.all([this.db.cards.clear(), this.db.outbox.clear(), this.db.meta.clear()]);
  }
}

import Dexie, { type EntityTable } from "dexie";
import type { Card } from "../domain/card";
import type { CollectionStore } from "../ports";

class BinderDb extends Dexie {
  cards!: EntityTable<Card, "id">;
  outbox!: EntityTable<{ cardId: string }, "cardId">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ cards: "id", outbox: "cardId" });
  }
}

export class DexieCollectionStore implements CollectionStore {
  private db: BinderDb;

  constructor(name = "the-binder") {
    this.db = new BinderDb(name);
  }

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
      await this.db.outbox.bulkPut(cards.map((c) => ({ cardId: c.id })));
    });
  }

  pendingChanges() {
    return this.db.outbox.count();
  }

  async clear() {
    await Promise.all([this.db.cards.clear(), this.db.outbox.clear()]);
  }
}

import { useState } from "react";
import type { Card } from "../domain/card";
import { CardDetail } from "./CardDetail";
import { CardForm } from "./CardForm";
import { CollectionScreen } from "./CollectionScreen";
import { useCards } from "./useCards";

type View = { name: "list" } | { name: "form"; card?: Card } | { name: "detail"; id: string };

export function App() {
  const { cards, save, remove } = useCards();
  const [view, setView] = useState<View>({ name: "list" });

  if (view.name === "form") {
    const { card } = view;
    return (
      <CardForm
        card={card}
        cards={cards}
        onSave={async (saved) => {
          await save(saved);
          setView(card ? { name: "detail", id: saved.id } : { name: "list" });
        }}
        onCancel={() => setView(card ? { name: "detail", id: card.id } : { name: "list" })}
      />
    );
  }

  if (view.name === "detail") {
    const card = cards.find((c) => c.id === view.id);
    if (card) {
      return (
        <CardDetail
          card={card}
          onEdit={() => setView({ name: "form", card })}
          onDelete={async () => {
            await remove(card);
            setView({ name: "list" });
          }}
          onBack={() => setView({ name: "list" })}
        />
      );
    }
  }

  return (
    <CollectionScreen
      cards={cards}
      onAdd={() => setView({ name: "form" })}
      onOpen={(card) => setView({ name: "detail", id: card.id })}
    />
  );
}

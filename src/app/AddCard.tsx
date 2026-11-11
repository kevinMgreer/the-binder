/** The screen's one add button; it opens the add form. */
export function AddCard({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="add-bar">
      <button className="primary add-button" onClick={onAdd}>
        Add card
      </button>
    </div>
  );
}

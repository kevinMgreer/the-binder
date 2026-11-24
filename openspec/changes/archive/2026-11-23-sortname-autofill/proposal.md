## Why

The Sort name field starts empty, so the owner has to type a last name on every card where they want to see or change how it sorts. The list already works the last name out from Player (`lastNameKey`); the form should show that value and let the owner edit it.

## What Changes

- The Sort name field fills itself from the Player (and Team) text as the user types, with the same value the list sorts by today.
- It stops following once the user edits it, and starts again if they clear it.
- A card with a stored sort name keeps it; the form never replaces it.
- A sort name is stored only when it differs from the derived one, so existing cards sort the same and need no migration.
- The hint under the field says it follows the last name and can be changed.

## Out of scope

- Any change to how the list sorts, the dashboard tie keys, the card schema or the Drive file version.

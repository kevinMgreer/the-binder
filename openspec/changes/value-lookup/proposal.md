## Why

The owner wants a quick idea of what a card sells for. Ruling T-56 settled how: a link to eBay's sold and completed listings, built from the card's own fields. No API, no keys, no spend.

## What Changes

- The card detail screen gets a "Check sold prices" link between the last-edited line and the action row.
- The link opens eBay's sold and completed listings search for Sports Trading Cards in the phone's browser.
- The search words come from the card: year, manufacturer, set, player, card number, parallel name, "/printRun" for a serial-numbered parallel with a known print run, "RC" / "Auto" / "Relic" from the flags, and grading company and grade for a graded card. Empty fields are left out.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `collection-list`: the card detail fact sheet gains the "Check sold prices" link (new requirement), and the fact sheet's top-to-bottom order names it.

## Impact

- `src/domain/value-query.ts` (new, pure function) and `src/domain/value-query.test.ts` (new).
- `src/app/CardDetail.tsx` and `src/app/card-detail.test.tsx`.
- `docs/device-checklist.md`: one new phone check line.
- No new dependency, plugin, permission, or card schema change. $0: a plain link.

## Out of scope

- Storing a value or price on the card, collection totals.
- Other price sites (130point, PSA, others).
- Team, subset, insert, raw condition and notes in the search (see design, open questions).
- Hiding the link when offline: the browser shows its own offline page.

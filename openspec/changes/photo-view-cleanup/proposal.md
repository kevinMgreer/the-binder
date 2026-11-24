## Why

The full-size photo view spends its top third on a "Front photo view" heading, a Front/Back control and gaps, and shows the photo in a fixed 60vh box. Phone test: the heading is not needed and the screen should be cleaner.

## What Changes

- The visible "Front/Back photo view" heading is gone. The dialog keeps that text as its hidden accessible name.
- With both photos, the Front/Back control becomes one joined toggle in the same row as Close. It stays real buttons with aria-pressed.
- The photo fills the remaining height of the sheet.

## Capabilities

### Modified Capabilities

- `card-photos`: the "View photos" requirement says the view has no visible title.

## Out of scope

- Other sheets (their visible titles stay), the swipe and zoom behaviour, and the photo storage or sync.

## Impact

- `src/app/Sheet.tsx`, `src/app/CardDetail.tsx`, `src/app/PhotoView.tsx`, `src/app/app.css`, `src/app/card-detail.test.tsx`.
- No data, storage or sync change.

## Context

`CardDetail.tsx` renders the fact sheet; `src/domain/format.ts` already decides when a parallel counts as serial-numbered (`isSerialNumbered`, which handles old cards without the `serialNumbered` mark). `UpdateLink.tsx` already opens an outside address with `<a target="_blank" rel="noopener noreferrer">`, and the Capacitor WebView hands that to the system browser. Ruling T-56 chose an eBay sold-listings link over any price API.

## Decisions

- **A pure `valueQuery(card): string` in new `src/domain/value-query.ts`, plus `soldPricesUrl(card): string` beside it.** It collects the words in spec order, trims each, drops empty ones and joins with one space. The URL is built with `URLSearchParams` (`_nkw`, `LH_Sold=1`, `LH_Complete=1`, `_sacat=213`), so encoding is the platform's. Alternatives: build it inline in `CardDetail.tsx` (harder to test, mixes domain into the view); put it in `format.ts` (that file holds display labels; a new file keeps the accept claim's test file `src/domain/value-query.test.ts` on its own). $0: no network call from the app.
- **Serial-numbered uses `isSerialNumbered` from `format.ts`.** Same rule as the stamp and the list, including old cards. Alternative: read `parallel.serialNumbered` directly (wrong for cards saved before the mark). $0: unaffected.
- **Card number goes in bare ("27"), not "#27".** eBay's keyword search treats punctuation loosely and many listings omit the "#". Alternative: "#27" (open question below). $0: unaffected.
- **Manufacturer and set both go in, even when the set name starts with the manufacturer ("Topps Topps Chrome").** eBay matches all words, so a repeated word does not narrow the results. Alternative: drop the manufacturer when the set already contains it (extra rule, no gain). $0: unaffected.
- **A plain text link between the last-edited line and the action row.** Alternatives: a third button in the action row (breaks the two-button row the spec fixes), a fact row (facts are not controls), a Capacitor Browser plugin (new dependency; the brief says no new plugin). $0: unaffected.

## Risks

- The extra line adds about one line of height above the action row; the e2e check "Edit and Delete show without scrolling" (e2e/design.spec.ts, two portrait photos, 360 by 800) must stay green.
- Whether `target="_blank"` leaves the WebView for the system browser on this build is only provable on the phone (task 4.1).
- Accented names ("Acuña") go in as typed; eBay may match "Acuna" listings or not. The phone check shows whether results make sense.

## Open Questions

- Should the insert name (and subset) be in the search? An insert is a different card from the base, so leaving it out can show the wrong card's prices. The brief's list leaves both out; this change follows the brief.
- Card number as "27" or "#27"?
- Should the link be hidden or disabled when the card has too little to search on (only a player), or offline? This change always shows it.

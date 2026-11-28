## ADDED Requirements

### Requirement: Check sold prices
The card detail screen SHALL show a "Check sold prices" link between the last-edited line and the action row. The link SHALL point to `https://www.ebay.com/sch/i.html` with the search words in `_nkw` and `LH_Sold=1`, `LH_Complete=1` and `_sacat=213` (Sports Trading Cards). The search words SHALL be, in this order and separated by single spaces: year, manufacturer, set, player, card number, parallel name, "/" followed by the print run when the parallel is serial-numbered and its print run is known, "RC" when the card is a rookie, "Auto" when it has an autograph, "Relic" when it has a relic, and the grading company and grade when the card is graded. A field that is empty or blank SHALL be left out with no extra space. The link SHALL open in a new browsing context (`target="_blank"`) with `rel="noopener noreferrer"`, so the app hands it to the phone's browser.

#### Scenario: Plain base card
- **WHEN** the search words are built for a raw 2024 Topps Series 1 card #27 of Ronald Acuña Jr. with no parallel and no flags
- **THEN** they are exactly "2024 Topps Series 1 Ronald Acuña Jr. 27"

#### Scenario: Empty fields are left out
- **WHEN** the search words are built for a card with a blank manufacturer and no card number
- **THEN** neither appears, and the words hold no double space and no leading or trailing space

#### Scenario: Numbered parallel adds the print run
- **WHEN** the search words are built for a card whose parallel "Gold Refractor" is serial-numbered with print run 50
- **THEN** they end with "Gold Refractor /50"

#### Scenario: Parallel without a numbering adds no print run
- **WHEN** the search words are built for a card with a parallel "Refractor" that is not serial-numbered, or is serial-numbered with no known print run
- **THEN** they hold "Refractor" and no "/"

#### Scenario: Flags add RC, Auto and Relic
- **WHEN** the search words are built for a rookie card with an autograph and a relic
- **THEN** they end with "RC Auto Relic", in that order

#### Scenario: Graded card adds company and grade
- **WHEN** the search words are built for a card graded PSA 10
- **THEN** they end with "PSA 10"

#### Scenario: Raw condition is left out
- **WHEN** the search words are built for a raw card in Near Mint condition
- **THEN** they hold no condition word

#### Scenario: The link opens eBay sold listings
- **WHEN** a card is opened in the detail screen
- **THEN** a "Check sold prices" link is shown above the Delete and Edit row, its address is the eBay search with the card's search words in `_nkw` and `LH_Sold=1`, `LH_Complete=1` and `_sacat=213`, and it has `target="_blank"` and `rel="noopener noreferrer"`

## MODIFIED Requirements

### Requirement: The card detail screen is a tidy fact sheet
The system SHALL lay the card detail screen out, top to bottom, as: a header block, a 1 px rule, a plain list of facts, the photos, a muted last-edited line, the "Check sold prices" link and one action row. The header block SHALL hold only the player as a large title in the slab face with the serial stamp beside it on the title's first line (a long name wraps inside the width left of the stamp, and the stamp stays level with the first line), then one quiet muted line "year set · #number" (just "year set" for a card with no number). Both lines SHALL start at the content's left edge and the header SHALL have no minimum height of its own, but it SHALL breathe: at least 16 dp from the top of the screen content to the title, 8 dp between the title and the quiet line, and 12 dp or more from the quiet line to the rule. The fact list SHALL separate its rows by 1 px rules with the label in uppercase label type at the left and the value right-aligned (Manufacturer, Subset, Insert, Team, Parallel, Condition or grade, Quantity, and Traits when set, only those the card has; Team and Parallel are rows like the others, not a second line under the title), and SHALL NOT sit in a box. The photos SHALL be shown in trading-card frames as the `card-photos` capability describes. The action row SHALL hold Delete at the left as a danger-outlined button (danger text and border, transparent background) and Edit at the right as the filled primary button, both real buttons of the same height, width share and radius.

#### Scenario: Fact list
- **WHEN** a card with a team, a serial-numbered parallel, a grade and quantity 3 is opened
- **THEN** the title has the stamp beside it and the quiet line follows, then the rule, the ruled facts (including Team and Parallel rows), the framed photos and the last-edited line, and the action row with Delete and Edit is below that

#### Scenario: Header breathes
- **WHEN** a card with a team and a parallel is opened on a 360 by 800 phone
- **THEN** the title and the quiet line start at the same x position within 1 dp, the title starts at least 16 dp below the top of the screen content, the gap between the bottom of the title and the top of the quiet line is 8 dp within 2 dp, and the gap from the quiet line to the rule is at least 12 dp

#### Scenario: Team and Parallel are fact rows
- **WHEN** a card with a team and a parallel name is opened
- **THEN** the header has no third line, and the facts list has Team and Parallel rows in the same style as the other rows

#### Scenario: Long names wrap cleanly
- **WHEN** a card with a very long player name, a long set name, a serial-numbered parallel and a team is opened on a 360 by 800 phone
- **THEN** nothing overflows the width, the name wraps onto further lines left of the stamp, and the stamp is level with the first line of the name

#### Scenario: Detail without a number
- **WHEN** a card with no card number is opened
- **THEN** the quiet line reads "year set" with no "#"

#### Scenario: Photo strip framed
- **WHEN** a card with a portrait front photo and a landscape back photo is opened
- **THEN** the front sits in a portrait trading-card frame and the back in a landscape one, and tapping either opens the zoom view

#### Scenario: Two portrait photos fill the row
- **WHEN** a card with a portrait front and a portrait back photo is opened on a 360 by 800 phone
- **THEN** both frames are 200 dp tall within 4 dp and sit side by side without overlapping

#### Scenario: Two landscape photos fit the row
- **WHEN** a card with a landscape front and a landscape back photo is opened on a 360 by 800 phone
- **THEN** the two frames sit side by side inside the row without overlapping, each keeping the 3.5 by 2.5 ratio

#### Scenario: Actions in one row
- **WHEN** a card with two portrait photos and at most four facts is opened on a 360 by 800 phone with a 24 dp status bar and a 48 dp bottom inset
- **THEN** Delete and Edit are on one row with Delete to the left, both the same width and height, both in view without scrolling, and no other control is below them

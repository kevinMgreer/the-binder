## MODIFIED Requirements

### Requirement: Each card is a ruled row
The system SHALL show each card as one fixed-height row of 112 dp on the ground colour, separated from the next row by a 1 px rule, with no box, gradient or shadow of its own, holding its photo thumbnail in a trading-card frame and two lines: the player name in bold with the serial tag as a small stamp at the right end of the same line, and one quiet line "year set · #number" that continues with the parallel, grade and quantity as plain text where present. A card with no number SHALL show "year set" with no "· #" part. The thumbnail SHALL take the front photo's own orientation: a photo wider than tall is shown in a landscape frame, a photo taller than wide in a portrait frame, always the whole photo with no cropping, inside a fixed 96 dp square slot as tall as a portrait frame, so every row keeps the same height and the text column starts at the same place. The stored thumbnail SHALL be shown as it is, with no re-generation. The orientation SHALL come from the photo itself, so photos saved before this rule show correctly without being saved again; a card with no photo, or whose thumbnail has not loaded, SHALL show the portrait placeholder frame. The quiet line SHALL stay on one line; when it does not fit, the parallel, grade and quantity are cut with an ellipsis first, then the set, and the card number SHALL NOT be truncated while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the framed thumbnail, the player in bold with the tag stamp at the right, and one quiet line with "year set · #number" followed by its parallel, grade and quantity when it has them

#### Scenario: Row without a number
- **WHEN** a card with no card number is listed
- **THEN** its quiet line reads "year set" with no "#" and no dangling separator

#### Scenario: Ruled, not boxed
- **WHEN** two cards are listed one above the other, in the light and in the dark theme
- **THEN** each row is 112 dp high, a 1 px rule separates them, and neither row has a background gradient, a translucent background or a shadow

#### Scenario: Bigger thumbnail
- **WHEN** a card with a portrait front photo is listed
- **THEN** its framed thumbnail is 96 dp tall within 2 dp

#### Scenario: Landscape photo
- **GIVEN** a card whose front photo is wider than tall
- **WHEN** it is listed
- **THEN** its thumbnail is wider than tall, its width-to-height ratio matches the photo's within 2 percent (nothing cropped), and its row is as tall as a row with a portrait photo

#### Scenario: Portrait photo
- **GIVEN** a card whose front photo is taller than wide
- **WHEN** it is listed
- **THEN** its thumbnail is taller than wide and matches the photo's ratio within 2 percent

#### Scenario: Photo saved earlier
- **GIVEN** a landscape photo saved before this change
- **WHEN** the card is listed
- **THEN** its thumbnail is shown landscape, with no re-save or migration

#### Scenario: No photo
- **WHEN** a card without a front photo is listed
- **THEN** its row shows a portrait placeholder frame in the same slot

#### Scenario: Text column aligned
- **WHEN** a landscape-photo card and a portrait-photo card are listed one above the other
- **THEN** their player names start at the same horizontal position

#### Scenario: Long extras
- **WHEN** a card has a long parallel name, a grade and a quantity above one
- **THEN** the quiet line stays one line high, the extras are cut with an ellipsis, and the card number stays visible

#### Scenario: Long names
- **WHEN** a card's set name is longer than the row width
- **THEN** the set name is cut with an ellipsis on its one line and the card number stays visible

### Requirement: The card detail screen is a tidy fact sheet
The system SHALL lay the card detail screen out, top to bottom, as: a header block, a 1 px rule, a plain list of facts, the photos, a muted last-edited line and one action row. The header block SHALL hold only the player as a large title in the slab face with the serial stamp beside it on the title's first line (a long name wraps inside the width left of the stamp, and the stamp stays level with the first line), then one quiet muted line "year set · #number" (just "year set" for a card with no number). Both lines SHALL start at the content's left edge and the header SHALL have no minimum height of its own, but it SHALL breathe: at least 16 dp from the top of the screen content to the title, 8 dp between the title and the quiet line, and 12 dp or more from the quiet line to the rule. The fact list SHALL separate its rows by 1 px rules with the label in uppercase label type at the left and the value right-aligned (Manufacturer, Subset, Insert, Team, Parallel, Condition or grade, Quantity, and Traits when set, only those the card has; Team and Parallel are rows like the others, not a second line under the title), and SHALL NOT sit in a box. The photos SHALL be shown in trading-card frames as the `card-photos` capability describes. The action row SHALL hold Delete at the left as a danger-outlined button (danger text and border, transparent background) and Edit at the right as the filled primary button, both real buttons of the same height, width share and radius.

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

## ADDED Requirements

### Requirement: Delete asks in a centred dialog
The system SHALL, when Delete is tapped on the card detail screen, show a modal dialog (role alertdialog, named "Delete card") centred on the screen over a scrim, with the question "Delete this card?", a Keep button that has focus when the dialog opens, and a Delete button in the danger colour. Delete in the dialog SHALL delete the card as the `card-catalog` capability describes (soft delete, its photos queued for removal from Drive) and leave the detail screen. Keep, a tap on the scrim, Escape and Android back SHALL close the dialog without deleting and return focus to the screen's Delete button; Android back SHALL close the dialog before it leaves the screen. The dialog SHALL be fully visible without scrolling at any scroll position of the detail screen and SHALL sit above the system bars.

#### Scenario: Dialog over the screen
- **GIVEN** the detail screen of a card is scrolled to its end on a 360 by 800 phone
- **WHEN** the user taps Delete
- **THEN** a "Delete card" alertdialog is centred in the viewport with its Keep and Delete buttons in view, Keep has focus, and the dialog's Delete text is in the danger colour

#### Scenario: Confirm deletes
- **WHEN** the user taps Delete and then Delete in the dialog
- **THEN** the card leaves the collection and the screen it was opened from is shown

#### Scenario: Keep keeps the card
- **WHEN** the user taps Delete and then Keep
- **THEN** the dialog closes, the card is unchanged and the Delete button has focus

#### Scenario: Back closes the dialog first
- **WHEN** the user taps Delete and presses Android back
- **THEN** the dialog closes, the detail screen is still shown and the card is unchanged; pressing back again leaves the detail screen

#### Scenario: Scrim tap keeps the card
- **WHEN** the user taps Delete and then taps the scrim outside the dialog
- **THEN** the dialog closes and the card is unchanged

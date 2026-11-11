## MODIFIED Requirements

### Requirement: Serial-numbered cards stand out
The system SHALL mark a card marked serial-numbered with its existing serial label (for example 13/150, or ?/99 when the serial is unreadable) in the accent colour, on the list row and on the card detail screen, and SHALL NOT show a tag on a card that is not serial-numbered, even when it has a print run. A card saved before the mark existed counts as serial-numbered when it has a serial number or a print run.

#### Scenario: Tag on a serial-numbered card
- **WHEN** a serial-numbered card with serial 13 and print run 150 is listed
- **THEN** its row shows the tag 13/150 in the accent colour, as readable text

#### Scenario: Unreadable serial
- **WHEN** a serial-numbered card has print run 99 and an unreadable serial number
- **THEN** its row shows the tag ?/99

#### Scenario: No tag otherwise
- **WHEN** a card is not serial-numbered
- **THEN** its row shows no tag and no empty space reserved for one

#### Scenario: Print run only
- **WHEN** a card has print run 99 and is not marked serial-numbered
- **THEN** its row and detail screen show no tag, and the dashboard Serial-numbered tile does not count it

### Requirement: Each card is a pocket row
The system SHALL show each card as one fixed-height row with its photo thumbnail and two lines: the player name in bold with the serial tag as a small badge at the right end of the same line, and one quiet line "year set · #number" that continues with the parallel, grade and quantity as plain text where present. A card with no number SHALL show "year set" with no "· #" part. The thumbnail SHALL take the front photo's own orientation: a photo wider than tall is shown landscape, a photo taller than wide is shown portrait, always the whole photo with no cropping, inside a fixed square slot as tall as a portrait thumbnail, so every row keeps the same height and the text column starts at the same place. The orientation SHALL come from the photo itself, so photos saved before this rule show correctly without being saved again; a card with no photo, or whose thumbnail has not loaded, SHALL show the portrait placeholder. The quiet line SHALL stay on one line; when it does not fit, the parallel, grade and quantity are cut with an ellipsis first, then the set, and the card number SHALL NOT be truncated while the text size is at its default.

#### Scenario: Row content
- **WHEN** a card is listed
- **THEN** the row shows the thumbnail, the player in bold with the tag badge at the right, and one quiet line with "year set · #number" followed by its parallel, grade and quantity when it has them

#### Scenario: Row without a number
- **WHEN** a card with no card number is listed
- **THEN** its quiet line reads "year set" with no "#" and no dangling separator

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
- **THEN** its row shows a portrait placeholder in the same slot

#### Scenario: Text column aligned
- **WHEN** a landscape-photo card and a portrait-photo card are listed one above the other
- **THEN** their player names start at the same horizontal position

#### Scenario: Long extras
- **WHEN** a card has a long parallel name, a grade and a quantity above one
- **THEN** the quiet line stays one line high, the extras are cut with an ellipsis, and the card number stays visible

#### Scenario: Long names
- **WHEN** a card's set name is longer than the row width
- **THEN** the set name is cut with an ellipsis on its one line and the card number stays visible

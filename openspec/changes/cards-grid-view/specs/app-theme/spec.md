## MODIFIED Requirements

### Requirement: Photos sit in trading-card frames
The system SHALL show every card photo and the photo placeholder inside a trading-card frame: a 2.5 by 3.5 rectangle (3.5 by 2.5 when the photo is wider than tall), 6 px radius, a 1 px keyline in the ink colour, a 3 px inner print border in the frame print colour and a thin inner rule, with the whole photo shown inside (never cropped). This applies to the list thumbnails, the Cards grid tiles, Recently added, the detail photo strip and the form's photo slots.

#### Scenario: Portrait frame ratio
- **WHEN** a card with a portrait front photo is shown in Recently added, in the list and in the Cards grid
- **THEN** each frame's width-to-height ratio is 2.5 to 3.5 within 2 percent

#### Scenario: Landscape frame
- **WHEN** a card whose front photo is wider than tall is shown in Recently added, in the list and in the Cards grid
- **THEN** each frame's width-to-height ratio is 3.5 to 2.5 within 2 percent and the image inside keeps the photo's ratio within 2 percent

#### Scenario: Placeholder framed
- **WHEN** a card without a front photo is shown
- **THEN** its placeholder sits in a portrait frame with the same keyline and radius

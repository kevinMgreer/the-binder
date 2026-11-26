## MODIFIED Requirements

### Requirement: View photos
The system SHALL show thumbnails in the collection list, and on the card detail screen the front and back photos at 200 dp tall (a landscape photo at most half the content width), each showing the full photo when it is stored on the device and the thumbnail until then, always whole and uncropped. The detail screen SHALL NOT download a full photo by itself. The system SHALL open a full-size, zoomable view of a photo when it is tapped, fetching and caching the full photo when it is not on the device.

When the card has both a front and a back photo, the full-size view SHALL let the user switch to the other side without closing it: a horizontal swipe of at least 50 px that travels more sideways than up or down, made while the photo is not zoomed, SHALL show the back when swiped left on the front and the front when swiped right on the back; and two small page dots at the bottom of the photo, real buttons named "Front" and "Back" with the shown side marked pressed and a hit area of at least 24 px, SHALL switch to the side pressed. The view SHALL show no title text: its accessible name (visually hidden) SHALL read "Front photo view" or "Back photo view" for the side shown, the Close control SHALL be an icon-only X button named "Close", at least 48 px, at the top right, the photo SHALL fill the whole view on a dark backdrop with no frame, switching SHALL reset the zoom, and the side switched to SHALL load like a tapped photo (full photo when stored, fetched when online, thumbnail and the offline note otherwise). While the photo is zoomed in, a one-finger drag SHALL pan the photo and SHALL NOT switch sides. When the card has only one photo, the view SHALL show no page dots and a swipe SHALL do nothing.

#### Scenario: Detail shows the full photo when stored
- **GIVEN** a card whose full front photo is stored on the device
- **WHEN** the card detail opens
- **THEN** the front photo shown is the full photo, its frame is 200 dp tall within 4 dp, and the photo's ratio is kept within 2 percent

#### Scenario: Detail falls back to the thumbnail
- **GIVEN** a card whose full front photo is not on the device
- **WHEN** the card detail opens, online or offline
- **THEN** the front thumbnail is shown at the same 200 dp size and no full photo is downloaded until the user taps it

#### Scenario: View full photo offline
- **GIVEN** the device is offline and the full photo was not opened on this device before
- **WHEN** the user taps a photo on the card detail
- **THEN** the thumbnail is shown with a note that the full photo will load when online

#### Scenario: Zoom to read serial
- **WHEN** the user pinches to zoom on a full photo
- **THEN** the photo zooms and pans smoothly

#### Scenario: Swipe to the other side
- **GIVEN** a card with a front and a back photo, and the full-size view of the front open at normal zoom
- **WHEN** the user swipes left across the photo
- **THEN** the view shows the back photo, its accessible name reads "Back photo view", the "Back" button is pressed, and a swipe right then shows the front again with the accessible name "Front photo view"

#### Scenario: One photo only: no swipe
- **GIVEN** a card with a front photo and no back photo, and the full-size view of the front open
- **WHEN** the user swipes left or right across the photo
- **THEN** the front photo is still shown, the accessible name still reads "Front photo view", and no page dots are shown

#### Scenario: Zoomed photo pans instead of swiping
- **GIVEN** a card with a front and a back photo, and the full-size view of the front zoomed in
- **WHEN** the user drags one finger left across the photo
- **THEN** the front photo pans, stays zoomed, and the accessible name still reads "Front photo view"

#### Scenario: Control switches side
- **GIVEN** a card with a front and a back photo, and the full-size view of the front zoomed in
- **WHEN** the user taps the "Back" button
- **THEN** the view shows the back photo at normal zoom, its accessible name reads "Back photo view" and the "Back" button is pressed


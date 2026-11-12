## MODIFIED Requirements

### Requirement: Scan a card with the rear camera
The system SHALL open an in-app scanner on the rear camera when the user taps "Scan front" or "Scan back" on the card form, and when the form opens the back scanner by itself after a front scan (see "Capture front and back" in the `card-photos` capability), and SHALL detect the card's edges and save the photo straightened and cropped to the card.

#### Scenario: Scanner opens on the rear camera
- **WHEN** the user taps "Scan front" on the add form on a phone that has Google Play services
- **THEN** the scanner opens showing the rear camera, not the front camera

#### Scenario: Photo cropped to the card
- **WHEN** the user captures a card lying on a table
- **THEN** the saved photo shows only the card, straightened, with the surrounding table cropped away

#### Scenario: Front then back
- **GIVEN** the Back tile is empty
- **WHEN** the user accepts the front scan with the scanner's own accept button
- **THEN** the front photo is attached and the same rear-camera scanner opens again for the back; the user skips the back by closing it, which leaves the form with the front photo and an empty Back tile

#### Scenario: Back scanner falls back like any scan
- **WHEN** the back scanner opens after a front scan on a phone without Google Play services, or where the scanner's module cannot be fetched
- **THEN** the system camera opens for the back instead, with no error shown

#### Scenario: Retake
- **WHEN** the user is not happy with a scan and retakes it before accepting
- **THEN** the retaken photo replaces the earlier one and only one photo is saved for that side

#### Scenario: Retake from the card form
- **WHEN** the user taps "Retake front" or "Retake back" on the card form, shown in place of "Scan front" or "Scan back" once that side has a photo
- **THEN** the same rear-camera scanner opens and the new photo replaces that side's photo

## ADDED Requirements

### Requirement: Name the side being scanned
The system SHALL show a short message over the scanner that names the side being scanned, "Scan the front of the card" or "Scan the back of the card", every time a scan is started from a photo tile (Scan, Retake, and the back scan the form opens by itself after a front scan). The message SHALL NOT appear for "Pick front from photos" or "Pick back from photos". The system SHALL NOT require the system-camera fallback to show it.

#### Scenario: Front scan names the front
- **WHEN** the user chooses "Scan front" or "Retake front" on a phone where the scanner runs
- **THEN** a message reading "Scan the front of the card" shows over the scanner

#### Scenario: Chained back scan names the back
- **WHEN** the back scanner opens by itself after the front scan
- **THEN** a message reading "Scan the back of the card" shows over the scanner

#### Scenario: Back scan from the Back tile names the back
- **WHEN** the user chooses "Scan back" or "Retake back"
- **THEN** a message reading "Scan the back of the card" shows over the scanner

#### Scenario: No message when picking from photos
- **WHEN** the user chooses "Pick front from photos" or "Pick back from photos"
- **THEN** no scanner opens and no such message shows

#### Scenario: Fallback camera shows no message
- **WHEN** the system camera opens instead of the scanner because the scanner cannot run
- **THEN** capture continues as before and no side message is required

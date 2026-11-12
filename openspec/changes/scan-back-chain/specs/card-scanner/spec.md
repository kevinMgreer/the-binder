## MODIFIED Requirements

### Requirement: Scan a card with the rear camera
The system SHALL open an in-app scanner on the rear camera when the user taps "Scan front" or "Scan back" on the card form, and SHALL detect the card's edges and save each photo straightened and cropped to the card. When "Scan front" also takes the back (see "Capture front and back" in the `card-photos` capability), the same scanner session SHALL allow a second page for the back.

#### Scenario: Scanner opens on the rear camera
- **WHEN** the user taps "Scan front" on the add form on a phone that has Google Play services
- **THEN** the scanner opens showing the rear camera, not the front camera

#### Scenario: Photo cropped to the card
- **WHEN** the user captures a card lying on a table
- **THEN** the saved photo shows only the card, straightened, with the surrounding table cropped away

#### Scenario: Front then back
- **GIVEN** the Back tile is empty
- **WHEN** the user scans the front from "Scan front"
- **THEN** the scanner stays open and allows a second page, which is the back; the user skips the back by accepting after the front, which leaves the form with the front photo and an empty Back tile

#### Scenario: Front then back without the scanner
- **WHEN** the user taps "Scan front" with an empty Back tile on a phone without Google Play services, or where the scanner's module cannot be fetched
- **THEN** the system camera opens for the front and, once the front is taken, opens again for the back, with no error shown

#### Scenario: Retake
- **WHEN** the user is not happy with a scan and retakes it before accepting
- **THEN** the retaken photo replaces the earlier one and only one photo is saved for that side

#### Scenario: Retake from the card form
- **WHEN** the user taps "Retake front" or "Retake back" on the card form, shown in place of "Scan front" or "Scan back" once that side has a photo
- **THEN** the same rear-camera scanner opens for one page and the new photo replaces that side's photo

## ADDED Requirements

### Requirement: Name the side being scanned
The system SHALL show a short message over the scanner that names what to scan every time a scan is started from a photo tile: "Scan the front of the card, then the back" when the scan takes both sides, otherwise "Scan the front of the card" or "Scan the back of the card". The message SHALL NOT appear for "Pick front from photos" or "Pick back from photos". The system SHALL NOT require the system-camera fallback to show it.

#### Scenario: Front and back scan names the order
- **WHEN** the user chooses "Scan front" with an empty Back tile on a phone where the scanner runs
- **THEN** a message reading "Scan the front of the card, then the back" shows over the scanner

#### Scenario: One-page front scan names the front
- **WHEN** the user chooses "Retake front", or "Scan front" while the Back tile has a photo
- **THEN** a message reading "Scan the front of the card" shows over the scanner

#### Scenario: Back scan names the back
- **WHEN** the user chooses "Scan back" or "Retake back"
- **THEN** a message reading "Scan the back of the card" shows over the scanner

#### Scenario: No message when picking from photos
- **WHEN** the user chooses "Pick front from photos" or "Pick back from photos"
- **THEN** no scanner opens and no such message shows

#### Scenario: Fallback camera shows no message
- **WHEN** the system camera opens instead of the scanner because the scanner cannot run
- **THEN** capture continues as before and no side message is required

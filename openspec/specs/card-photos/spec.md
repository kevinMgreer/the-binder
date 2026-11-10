# card-photos Specification

## Purpose
Lets the owner photograph the front and back of each card with the phone camera, and keeps those photos compact, stored in Drive and viewable in the app.

## Requirements

### Requirement: Photos are taken from the card form
The system SHALL offer, in the photo section of the add and edit card forms, for each of front and back, a Scan action (the rear-camera scanner of the `card-scanner` capability, with its system-camera fallback) and a Pick from photos action. After a photo is taken or picked, the user SHALL be on the same form with that photo attached to its side and every field value, suggestion marker and the other side's photo kept. Closing the scanner or picker without a photo SHALL leave the form as it was. Cancel on the add form SHALL discard the new card and every photo taken for it. On-device recognition SHALL run when a new photo is attached and SHALL fill only fields the user has not edited; Claude SHALL be called only when the user taps "Identify with Claude".

#### Scenario: Photo slots on the add form
- **WHEN** the add form opens from Add card
- **THEN** the front slot offers "Scan front" and "Pick front from photos", the back slot offers "Scan back" and "Pick back from photos", and every field is empty and editable

#### Scenario: Fields kept after a scan
- **GIVEN** the user typed "Hank Aaron" as the player on the add form
- **WHEN** the user taps "Scan front" and accepts a scan
- **THEN** the same form shows the front photo, the player still reads "Hank Aaron", and the front slot now offers "Retake front"

#### Scenario: Scanner closed without a photo
- **GIVEN** the user typed a year on the add form
- **WHEN** the user taps "Scan back" and closes the scanner without a photo
- **THEN** the form shows no back photo and the year is unchanged

#### Scenario: Pick from photos
- **WHEN** the user taps "Pick back from photos" and selects an image
- **THEN** the form shows that image as the back photo

#### Scenario: Cancel discards
- **WHEN** the user scans a front photo on the add form and taps Cancel
- **THEN** no card is added, no photo is stored on the device or queued for Drive, and the screen the user came from is shown

#### Scenario: Identification triggers unchanged
- **WHEN** a front photo is attached on the add form
- **THEN** on-device recognition fills empty, unedited fields as suggestions, "Identify with Claude" is offered, and no request is made to Claude until the user taps it

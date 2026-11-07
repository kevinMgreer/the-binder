# Spec Delta

## Purpose

Turns a card photo into suggested card details so the owner types less: free on-device text recognition by default, with Claude Vision available on request for harder cards.

## ADDED Requirements

### Requirement: On-device recognition by default
The system SHALL run free on-device text recognition on a newly captured front or back photo and pre-fill any fields it can read, without sending the photo anywhere.

#### Scenario: Scan a base card
- **WHEN** the user captures the back of a card that prints the year, set name and card number
- **THEN** the year, card number and any recognized set name are pre-filled and marked as suggestions

#### Scenario: Nothing recognized
- **WHEN** on-device recognition reads no usable details
- **THEN** the form opens empty with a message offering "Identify with Claude"

#### Scenario: Works offline
- **GIVEN** the device is offline
- **WHEN** the user captures a card photo
- **THEN** on-device recognition still runs

### Requirement: Claude Vision on demand
The system SHALL offer an "Identify with Claude" action that sends the card's front and back photos for identification, and SHALL call Claude only when the user taps it.

#### Scenario: Identify a parallel
- **WHEN** the user taps "Identify with Claude" on a serial-numbered Gold parallel
- **THEN** the form is pre-filled with player, year, set, card number, team, parallel name, serial number and print run as suggestions

#### Scenario: Never automatic
- **WHEN** the user captures, edits or saves a card without tapping "Identify with Claude"
- **THEN** no request is made to Claude

#### Scenario: Offline
- **WHEN** the user taps "Identify with Claude" while offline
- **THEN** the system says it needs a connection and makes no request

### Requirement: Suggestions are confirmed by the user
The system SHALL treat all identification results as suggestions the user reviews and edits before saving, and SHALL record whether each saved card was entered manually, from on-device recognition, or from Claude.

#### Scenario: Low-confidence field
- **WHEN** an identification result is uncertain about a field
- **THEN** that field is visibly flagged for review

#### Scenario: User overrides a suggestion
- **WHEN** the user changes a suggested value and saves
- **THEN** the user's value is saved

### Requirement: API key never reaches the device
The system SHALL keep the Anthropic API key on a server-side proxy and SHALL NOT include it in the APK or in any file stored on the device.

#### Scenario: Inspect the APK
- **WHEN** anyone unpacks the APK or watches the app's network traffic
- **THEN** no Anthropic API key appears

### Requirement: Proxy serves only the owner
The proxy SHALL accept identification requests only when they carry a valid Google credential for the owner's account, and SHALL reject all others before calling Claude.

#### Scenario: Request from another Google account
- **WHEN** the proxy receives a request with a valid Google credential for a different account
- **THEN** it rejects the request and does not call Claude

#### Scenario: Request with no credential
- **WHEN** the proxy receives a request without a Google credential
- **THEN** it rejects the request and does not call Claude

### Requirement: Spend limits
The proxy SHALL cap the number of Claude identifications per day and the image size per request, and SHALL refuse requests beyond either limit.

#### Scenario: Daily cap reached
- **GIVEN** the daily identification limit has been reached
- **WHEN** the user taps "Identify with Claude"
- **THEN** the system says the daily limit is reached and offers on-device recognition or manual entry

#### Scenario: Oversized upload
- **WHEN** a request's images exceed the size limit
- **THEN** the proxy rejects it without calling Claude

# card-identification Specification

## Purpose
Turns a card photo into suggested card details so the owner types less: free on-device text recognition by default, with Claude Vision available on request for harder cards.

## Requirements

### Requirement: On-device recognition by default
The system SHALL run free on-device text recognition on a newly captured front or back photo and pre-fill any fields it can read, without sending the photo anywhere.

#### Scenario: Scan a base card
- **WHEN** the user captures the back of a card that prints the year, set name and card number
- **THEN** the year, card number and any recognized set name are pre-filled and marked as suggestions

#### Scenario: Nothing recognized
- **WHEN** on-device recognition reads no usable details
- **THEN** the form keeps its fields and shows a note offering "Identify with Claude"

#### Scenario: Works offline
- **GIVEN** the device is offline
- **WHEN** the user captures a card photo
- **THEN** on-device recognition still runs

### Requirement: Claude Vision on demand
The system SHALL offer an "Identify with Claude" action that sends the card's front and back photos for identification, and SHALL call Claude only when the user taps it.

Claude's result SHALL be able to fill player, team, year, manufacturer, set, subset, insert, card number, the parallel (name, serial number, print run) and the Rookie, Autograph and Relic flags. The instructions sent to Claude SHALL define each of these, one sentence each:
- rookie: the card shows an RC logo or "Rookie Card" text;
- autograph: the card is signed on the card or on a sticker, not a printed facsimile;
- relic: the card holds an embedded jersey, bat or patch piece, or says "Game-Used";
- set: the product, such as Topps Series 1 or Bowman Chrome;
- subset: a themed group numbered inside the base set, such as Future Stars or League Leaders;
- insert: a separately numbered chase set, often with its own number prefix such as HRD-5;
- parallel: a colour or finish version of a base or insert card, such as Gold or Refractor, often serial-numbered.

A suggestion SHALL only tick a flag; a flag Claude reports as false or leaves out SHALL leave the checkbox as it is.

#### Scenario: Identify a parallel
- **WHEN** the user taps "Identify with Claude" on a serial-numbered Gold parallel
- **THEN** the form is pre-filled with player, year, set, card number, team, parallel name, serial number and print run as suggestions

#### Scenario: Identify a rookie card
- **WHEN** the user taps "Identify with Claude" on a card with the RC logo and Claude reports it as a rookie
- **THEN** Rookie is ticked and marked as a suggestion, and Autograph and Relic stay unticked

#### Scenario: Identify an on-card autograph
- **WHEN** the user taps "Identify with Claude" on a card signed on the card and Claude reports it as an autograph
- **THEN** Autograph is ticked and marked as a suggestion

#### Scenario: Identify a relic or patch card
- **WHEN** the user taps "Identify with Claude" on a card with an embedded jersey patch and Claude reports it as a relic
- **THEN** Relic is ticked and marked as a suggestion

#### Scenario: Identify an insert
- **WHEN** the user taps "Identify with Claude" on card HRD-5 of the Home Run Derby insert in Topps Series 1, and Claude reports set "Series 1", insert "Home Run Derby" and card number "HRD-5"
- **THEN** Set shows "Series 1", Insert shows "Home Run Derby", Card number shows "HRD-5" and Parallel stays empty

#### Scenario: Identify a parallel of the base set
- **WHEN** the user taps "Identify with Claude" on a Gold parallel of a Topps Series 1 base card, and Claude reports set "Series 1" and parallel "Gold" with no insert
- **THEN** Set shows "Series 1", Parallel shows "Gold" and Insert stays empty

#### Scenario: Identify a subset card
- **WHEN** the user taps "Identify with Claude" on a Future Stars card of the Topps Series 1 base set, and Claude reports set "Series 1" and subset "Future Stars"
- **THEN** Set shows "Series 1", Subset shows "Future Stars" and Insert stays empty

#### Scenario: A suggestion never unticks a flag
- **GIVEN** Rookie is ticked on the card
- **WHEN** the user taps "Identify with Claude" and Claude reports rookie as false or leaves it out
- **THEN** Rookie stays ticked

#### Scenario: Doubtful flag
- **WHEN** Claude reports Relic with low confidence
- **THEN** Relic is ticked and shows "Suggested · Check this"

#### Scenario: Only real booleans count
- **WHEN** Claude reports a flag as anything other than true or false, such as the text "yes"
- **THEN** that flag is dropped from the result and its checkbox is unchanged

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

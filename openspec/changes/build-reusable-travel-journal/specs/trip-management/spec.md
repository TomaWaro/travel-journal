## ADDED Requirements

### Requirement: Workspace can manage reusable trips
The system SHALL allow an owner to create and manage multiple trips within a reusable workspace so the product can be used for future journeys without schema changes.

#### Scenario: Owner creates a new trip
- **WHEN** the owner creates a trip with a title, date range, and default visibility
- **THEN** the system stores a new trip record linked to the workspace

#### Scenario: Owner reuses the app for a later journey
- **WHEN** the owner creates a second trip after a previous trip already exists
- **THEN** the system keeps both trips separately addressable and viewable

### Requirement: Trip can be organized into route legs and days
The system SHALL model a trip as a sequence of route legs and travel days so itinerary, capture, and publication can be grouped consistently.

#### Scenario: Owner defines a route leg
- **WHEN** the owner creates or imports a leg with an origin and destination
- **THEN** the system links that leg to the trip in a stable order

#### Scenario: Day view resolves captured content
- **WHEN** a contributor opens a given trip day
- **THEN** the system returns the moments, legs, and draft story context associated with that day

### Requirement: Trip visibility settings must be configurable
The system SHALL allow each trip to define private and quasi-public visibility rules independently from other trips.

#### Scenario: Owner changes trip visibility
- **WHEN** the owner updates the trip visibility mode or map privacy setting
- **THEN** the system applies the new visibility rules only to that trip

#### Scenario: Public viewer opens a private trip
- **WHEN** a public viewer requests a trip that is not published or not visible to them
- **THEN** the system denies access to unpublished private content

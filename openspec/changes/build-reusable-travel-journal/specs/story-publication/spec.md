## ADDED Requirements

### Requirement: Owner can generate a draft story from trip content
The system SHALL allow the owner to generate a draft daily or trip-level story from captured moments, route context, and track data.

#### Scenario: Owner generates a day recap
- **WHEN** the owner requests a recap for a specific trip day
- **THEN** the system creates or refreshes a draft story using the selected private source content

#### Scenario: Draft generation fails
- **WHEN** story generation cannot complete successfully
- **THEN** the system preserves the existing source content and reports the draft generation failure to the owner

### Requirement: Publication remains manual
The system SHALL keep generated stories unpublished until the owner explicitly publishes them.

#### Scenario: Draft remains private by default
- **WHEN** a draft story is generated
- **THEN** it is not visible on public trip pages until the owner publishes it

#### Scenario: Owner publishes a draft
- **WHEN** the owner approves and publishes a draft story
- **THEN** the system exposes the published story on its public route

### Requirement: Published stories must be share-friendly
The system SHALL expose published stories with stable URLs and metadata suitable for link sharing.

#### Scenario: Viewer shares a story link
- **WHEN** a published story URL is posted in a messaging platform
- **THEN** the public route serves the title, summary, and preview media required for rich link previews

#### Scenario: Story is unpublished later
- **WHEN** the owner retracts a published story
- **THEN** the public story route stops exposing the story content

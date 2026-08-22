# Receipt Management UI

## Requirements

### Requirement: Receipt Status Updates
The Recent Receipts component SHALL update to reflect changes in receipt and email status, with manual refresh capability for latest data.

#### Scenario: Email sent status updates immediately
- **WHEN** user sends a receipt via email
- **THEN** the email sent indicator appears immediately in the receipt list
- **AND** the send email button becomes disabled

#### Scenario: Manual refresh loads latest data
- **WHEN** user clicks the refresh button in Recent Receipts header
- **THEN** system fetches latest receipt data from server
- **AND** updates all receipt statuses including email opened status
- **AND** shows loading indicator during refresh

#### Scenario: Receipt generation updates immediately
- **WHEN** user generates a new receipt
- **THEN** the receipt appears in the Recent Receipts list immediately
- **AND** all receipt counts and filters update correctly

### Requirement: Manual Refresh Button
The Recent Receipts component SHALL provide a manual refresh button to allow users to reload receipt data on demand.

#### Scenario: Refresh button is visible
- **WHEN** user views Recent Receipts component
- **THEN** refresh button is displayed in the header area
- **AND** button shows refresh icon (ArrowPathIcon)
- **AND** button has tooltip "Actualiser les données des quittances"

#### Scenario: Refresh button functionality
- **WHEN** user clicks refresh button
- **THEN** system initiates data fetch from server
- **AND** button shows loading spinner during refresh
- **AND** button is disabled to prevent multiple clicks
- **AND** "Last updated" timestamp updates after successful refresh

#### Scenario: Refresh handles errors gracefully
- **WHEN** refresh request fails
- **THEN** system shows error notification to user
- **AND** button returns to normal state
- **AND** existing data remains visible
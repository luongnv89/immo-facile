## 1. Update Redux State for Email Sending
- [ ] 1.1 Modify `sendReceiptEmail` fulfilled case in receiptSlice to update `email_sent: true`
- [ ] 1.2 Update both `items` and `tenantReceipts` arrays in Redux state
- [ ] 1.3 Test that email sent status appears immediately after sending

## 2. Add Manual Refresh Button
- [ ] 2.1 Add refresh button to Recent Receipts component header
- [ ] 2.2 Import ArrowPathIcon from Heroicons for refresh button
- [ ] 2.3 Position button next to existing controls (search, filters)
- [ ] 2.4 Add click handler to trigger receipt data refetch

## 3. Implement Refresh Functionality
- [ ] 3.1 Add refresh state to component (loading, last refreshed timestamp)
- [ ] 3.2 Dispatch `fetchReceipts` action on refresh button click
- [ ] 3.3 Show loading spinner on refresh button during fetch
- [ ] 3.4 Update "last refreshed" timestamp after successful fetch

## 4. Add Refresh Visual Indicators
- [ ] 4.1 Add spinning animation to refresh button while loading
- [ ] 4.2 Show "Last updated: X minutes ago" text
- [ ] 4.3 Disable refresh button during loading to prevent double-clicks
- [ ] 4.4 Add tooltip "Refresh receipt data" to button

## 5. Optimize Receipt Generation Updates
- [ ] 5.1 Verify receipt generation updates work correctly
- [ ] 5.2 Add error handling for failed receipt generation updates
- [ ] 5.3 Test receipt appears immediately in Recent Receipts list

## 6. Testing and Validation
- [ ] 6.1 Test email sending status updates immediately
- [ ] 6.2 Test manual refresh functionality loads latest data
- [ ] 6.3 Test receipt generation updates
- [ ] 6.4 Test refresh button states (loading, disabled, tooltip)
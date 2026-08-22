# Change: Add Manual Refresh for Receipt Updates

## Why
The Recent Receipts component fails to update automatically in two critical scenarios:
1. After sending a receipt email, the UI doesn't show the email as sent
2. When a tenant opens an emailed receipt, the "Seen" status doesn't appear in the UI

Rather than implementing server-polling which could create unnecessary overhead, we'll add a manual refresh button that allows users to reload receipt data on demand.

## What Changes
- **Update Redux state** when emails are sent to reflect `email_sent: true`
- **Add refresh button** in Recent Receipts header to manually reload data
- **Ensure receipt generation updates** are immediately visible
- **Add loading states** for refresh operation

## Impact
- Affected specs: Receipt management UI components
- Affected code: `client/src/store/slices/receiptSlice.js`, `client/src/components/RecentReceipts.jsx`
- No breaking changes to existing APIs
- Minimal server overhead while giving users control over data freshness
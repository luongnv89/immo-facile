# Email Tracking Feature

## Overview
The ImmoFacile application now includes email tracking functionality to monitor when tenants open their receipt emails. This feature uses a tracking pixel (1x1 transparent image) embedded in the email HTML.

## How It Works

### 1. **Tracking Pixel**
When a receipt email is sent, a unique tracking token is generated and embedded as a 1x1 transparent image in the email:
```html
<img src="http://your-server.com/api/receipts/track/{token}" width="1" height="1" />
```

### 2. **Email Open Detection**
When the tenant opens the email in their email client:
- The email client requests the tracking image from your server
- The server logs the open event in the database
- The `email_opened` and `email_opened_at` fields are updated

### 3. **Visual Indicators**
In the dashboard, receipts show:
- ✅ **Green checkmark** - Email sent
- 👁️ **Blue eye icon** - Email opened by tenant

## Database Schema

New columns added to the `receipts` table:
- `tracking_token` (TEXT, UNIQUE) - Unique identifier for tracking
- `email_opened` (BOOLEAN, DEFAULT 0) - Whether email was opened
- `email_opened_at` (DATETIME) - Timestamp when email was opened

## Configuration

### Environment Variables
Add to your `.env` file:
```bash
SERVER_URL=http://localhost:5001  # Development
# or
SERVER_URL=https://your-domain.com  # Production
```

**Important:** In production, set `SERVER_URL` to your actual server domain (e.g., `https://api.yourdomain.com`) so the tracking pixel can be loaded correctly.

## API Endpoints

### Track Email Open
```
GET /api/receipts/track/:token
```
- Returns a 1x1 transparent GIF image
- Logs the email open event if token is valid
- Always returns 200 status with pixel (even on errors)

## Privacy & Limitations

### Limitations
1. **Image Blocking**: Many email clients block images by default. Users must enable images to be tracked.
2. **Privacy Tools**: Some email clients and privacy tools block tracking pixels.
3. **Accuracy**: Not 100% accurate - some opens may not be tracked, and some non-opens may be tracked (e.g., email previews).

### Privacy Compliance
- Tracking is used only for delivery confirmation purposes
- No personal data is collected beyond what's already in the system
- Consider adding a privacy notice in your email footer if required by local regulations (GDPR, etc.)

## Testing

### Development Testing
1. Start the server with proper `SERVER_URL` configuration
2. Generate a receipt and send it via email
3. Open the email in your email client
4. Check the dashboard - the receipt should show "Opened" status
5. Check server logs for: `Email opened for receipt ID: {id}`

### Production Testing
1. Ensure `SERVER_URL` is set to your production domain
2. Test with a real email address
3. Verify the tracking pixel URL is accessible from external networks
4. Check that your firewall/security settings allow GET requests to `/api/receipts/track/*`

## Troubleshooting

### Tracking Not Working
1. **Check SERVER_URL**: Ensure it's set correctly in your environment
2. **Check Logs**: Look for errors in server logs when email is opened
3. **Test Pixel URL**: Try accessing the tracking URL directly in a browser
4. **Email Client**: Some clients block all external images - test with different clients
5. **CORS**: Ensure your server allows requests from email clients

### False Positives
- Email preview panes may trigger opens
- Email forwarding may trigger multiple opens
- Consider the first open as the primary indicator

## Future Enhancements

Possible improvements:
- Track multiple opens with timestamps
- Track link clicks in emails
- Add email analytics dashboard
- Integration with third-party email services (SendGrid, Mailgun) for more robust tracking
- Webhook notifications when emails are opened

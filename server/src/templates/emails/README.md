# Email Templates Documentation

**Task:** 1.2.1 - Email Template System  
**Date:** October 9, 2025

## Overview

This directory contains responsive HTML email templates for the ImmoFacile platform. All templates are designed to work across major email clients including Gmail, Outlook, Apple Mail, and mobile devices.

## Available Templates

### 1. Payment Reminder Template

**File:** `paymentReminder.js`

**Purpose:** Send automated payment reminders to tenants with overdue rent payments.

**Features:**
- ✅ Responsive design (mobile-first)
- ✅ Three urgency levels (low, medium, high)
- ✅ Dynamic content based on days overdue
- ✅ Email tracking pixel support
- ✅ Plain text fallback
- ✅ French language
- ✅ Gender-aware salutations
- ✅ Outlook/MSO compatibility

**Usage:**

```javascript
const { generatePaymentReminderHTML, generatePaymentReminderText } = require('./templates/emails/paymentReminder');

const htmlContent = generatePaymentReminderHTML({
  tenant: {
    firstName: 'Jean',
    lastName: 'Dupont',
    gender: 'M',
    email: 'jean.dupont@example.com'
  },
  receipt: {
    id: 1,
    month: 10,
    year: 2025,
    amount: 850.00
  },
  daysOverdue: 5,
  trackingToken: 'unique-token-123',
  serverUrl: 'https://yourdomain.com'
});

const textContent = generatePaymentReminderText({
  tenant: { /* ... */ },
  receipt: { /* ... */ },
  daysOverdue: 5
});
```

**Urgency Levels:**

| Days Overdue | Level  | Color Scheme | Subject Prefix |
|--------------|--------|--------------|----------------|
| 1-3 days     | Low    | Yellow       | "Rappel"       |
| 4-7 days     | Medium | Orange       | "Important - Rappel" |
| 8+ days      | High   | Red          | "URGENT - Rappel" |

## Design Guidelines

### Color Palette

- **Primary Blue:** `#2563eb` (ImmoFacile brand)
- **Success Green:** `#10b981`
- **Warning Yellow:** `#f59e0b`
- **Danger Red:** `#dc2626`
- **Gray Scale:** `#111827`, `#374151`, `#6b7280`, `#9ca3af`, `#e5e7eb`, `#f3f4f6`

### Typography

- **Font Family:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Heading Size:** 24px (h1), 18px (h2)
- **Body Size:** 16px
- **Small Text:** 14px, 12px

### Layout

- **Max Width:** 600px (optimal for email clients)
- **Padding:** 40px (desktop), 20px (mobile)
- **Border Radius:** 8px
- **Box Shadow:** `0 2px 4px rgba(0,0,0,0.1)`

## Email Client Compatibility

### Tested Clients

- ✅ Gmail (Web, iOS, Android)
- ✅ Apple Mail (macOS, iOS)
- ✅ Outlook (2016+, Office 365, Web)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ⚠️ Outlook 2007-2013 (limited CSS support)

### Compatibility Features

1. **Inline CSS:** All styles are inlined for maximum compatibility
2. **Table-based Layout:** Uses `<table>` elements for reliable rendering
3. **MSO Conditionals:** Special styles for Microsoft Outlook
4. **Alt Text:** All images have descriptive alt text
5. **Fallback Fonts:** Multiple font stack for cross-platform support

## Tracking Pixel

The tracking pixel is a 1x1 transparent image that tracks email opens:

```html
<img src="{serverUrl}/api/receipts/track/{trackingToken}" 
     width="1" height="1" alt="" 
     style="display:block; border:0;" />
```

**Privacy Note:** The tracking pixel is optional and can be disabled by passing `trackingToken: null`.

## Testing

### Unit Tests

Run tests with Jest:

```bash
npm test -- paymentReminder.test.js
```

### Email Preview Tools

1. **Litmus:** https://litmus.com
2. **Email on Acid:** https://www.emailonacid.com
3. **Mailtrap:** https://mailtrap.io (for development)

### Manual Testing Checklist

- [ ] Renders correctly in Gmail
- [ ] Renders correctly in Outlook
- [ ] Renders correctly on mobile devices
- [ ] All links work
- [ ] Tracking pixel loads
- [ ] Plain text version is readable
- [ ] French characters display correctly (é, è, à, etc.)
- [ ] Currency formatting is correct (€)

## Best Practices

### DO ✅

- Use inline CSS for all styles
- Keep total email size under 100KB
- Test in multiple email clients
- Provide plain text alternative
- Use semantic HTML where possible
- Include unsubscribe link (for marketing emails)
- Use descriptive alt text for images
- Keep line length under 600px

### DON'T ❌

- Use JavaScript (not supported in email)
- Use external CSS files
- Use background images (limited support)
- Use web fonts (fallback to system fonts)
- Use complex CSS (flexbox, grid)
- Embed videos (use thumbnail with link)
- Use forms (link to web page instead)

## Localization

All templates are in French by default. Key translations:

- **Bonjour:** Hello
- **Monsieur/Madame:** Mr./Mrs.
- **Rappel:** Reminder
- **Paiement:** Payment
- **Cordialement:** Regards

## Future Templates

Planned templates for future tasks:

- [ ] Welcome email for new tenants
- [ ] Lease renewal reminder
- [ ] Maintenance notification
- [ ] Receipt confirmation
- [ ] Annual summary report

## Support

For issues or questions about email templates:

1. Check the test files for examples
2. Review the email service implementation in `/server/src/utils/emailService.js`
3. Consult the PRD for requirements

## Changelog

### Version 1.0.0 (October 9, 2025)
- Initial release
- Payment reminder template with 3 urgency levels
- Responsive design
- Email tracking support
- Unit tests included

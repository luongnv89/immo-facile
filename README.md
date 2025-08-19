# 🏠 ImmoFacile - Immobilier Facile

![Dashboard](dashboard.png)

**ImmoFacile** is a modern fullstack web application for property managers to handle tenant information and generate rent receipts with ease. Built with React, Node.js, and designed specifically for French property management requirements.

## ✨ Features

### 👥 Tenant Management
- Complete CRUD operations for tenant information
- Store contact details, rental amounts, and charges
- Auto-fill rent amounts when generating receipts

### 🧾 Receipt Generation
- Generate PDF rent receipts in French ("Quittance de Loyer")
- Customizable payment dates for accurate record-keeping
- Professional formatting with landlord signature support
- Automatic filename generation with tenant and period info
- **Email delivery**: Automatically send receipts to tenants via email

### 📊 Receipt Management
- **Advanced Search**: Search by tenant name or month/year
- **Smart Filtering**: Filter receipts by specific tenants
- **Flexible Sorting**: Sort by date, tenant name, or rental period
- **View Options**: Toggle between recent receipts and complete history
- Download and delete receipts with one click
- **Email receipts**: Send existing receipts to tenants via email

### 🎨 Modern Interface
- Clean, responsive design built with React and Tailwind CSS
- Real-time notifications for user feedback
- Intuitive dashboard with key statistics
- Mobile-friendly responsive layout

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database for data persistence
- **PDFKit** for professional PDF receipt generation
- **Nodemailer** for email delivery with PDF attachments
- **Security middleware**: Helmet, CORS, Rate limiting
- Environment-based configuration

### Frontend
- **React 18** with Vite for fast development
- **Redux Toolkit** for state management
- **Tailwind CSS** for modern styling
- **Heroicons** for consistent iconography
- **Axios** for API communication

## Project Structure

```
my-fullstack-app/
├── server/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── database/        # Database setup
│   │   └── utils/           # Utilities (PDF generation)
│   ├── receipts/            # Generated PDF files
│   ├── database/            # SQLite database files
│   └── index.js             # Server entry point
└── client/
    ├── src/
    │   ├── components/      # React components
    │   ├── store/           # Redux store and slices
    │   ├── services/        # API services
    │   └── App.jsx          # Main app component
    └── public/              # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-fullstack-app
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   npm start
   ```
   Server runs on http://localhost:5002

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Client runs on http://localhost:3000

4. **Configure Email (Optional)**
   To enable email functionality, add email configuration to your server `.env` file:
   ```bash
   # For Gmail (recommended)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
   
   **📧 Gmail Setup Guide**: See the detailed Gmail configuration section below.

5. **Access the application**
   Open your browser and navigate to http://localhost:3000

## 📡 API Endpoints

### Tenants
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Create new tenant  
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Receipts
- `POST /api/receipts/generate` - Generate new receipt (with payment date and optional email sending)
- `GET /api/receipts` - Get all receipts
- `GET /api/receipts/tenant/:tenantId` - Get receipts by tenant
- `GET /api/receipts/download/:id` - Download receipt PDF
- `POST /api/receipts/email/:id` - Send existing receipt via email
- `DELETE /api/receipts/:id` - Delete receipt

## ⚙️ Environment Variables

### Server (.env)
```env
PORT=5002
NODE_ENV=development
DB_PATH=./database/rentReceipts.db
RECEIPTS_DIR=./receipts
CORS_ORIGIN=http://localhost:3000

# Email Configuration (Required for email functionality)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5002/api
```

## 📧 Gmail Configuration for Property Owners

To enable automatic email delivery of rent receipts to your tenants, follow these steps to configure Gmail:

### Step 1: Enable 2-Factor Authentication
1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2FA (required for App Passwords)

### Step 2: Generate App Password
1. In your Google Account, go to **Security** → **App passwords**
2. Select **Mail** as the app and **Other (custom name)** as the device
3. Enter "ImmoFacile" as the custom name
4. Click **Generate** - Google will provide a 16-character password
5. **Important**: Copy this password immediately (you won't see it again)

### Step 3: Configure Environment Variables
Add these settings to your server `.env` file:

```env
# Gmail Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-property-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

**Replace with your details:**
- `EMAIL_USER`: Your Gmail address (this will appear as the sender)
- `EMAIL_PASSWORD`: The 16-character App Password from Step 2

### Step 4: Test Email Configuration
1. Restart your server after adding the email configuration
2. Add a tenant with a valid email address
3. Generate a receipt with the "Send via email" option checked
4. Check that the email was sent successfully (check server logs)

### Alternative Email Providers

**For other email providers**, update the configuration accordingly:

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Yahoo Mail:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

### Email Features
- **Professional Templates**: Emails are sent in French with professional formatting
- **PDF Attachments**: Rent receipts are automatically attached as PDF files
- **Tenant Information**: Emails include tenant name, rental period, and payment details
- **Automatic Naming**: Email subjects include tenant name and rental period
- **Error Handling**: System gracefully handles email failures without breaking receipt generation

### Troubleshooting
- **"Authentication failed"**: Double-check your App Password and ensure 2FA is enabled
- **"Connection refused"**: Verify EMAIL_HOST and EMAIL_PORT settings
- **"Email not sent"**: Check server logs for detailed error messages
- **Missing emails**: Check tenant's spam/junk folder

## 🔒 Security Features

- **Rate limiting**: 100 requests per 15 minutes per IP
- **CORS protection**: Configured for secure cross-origin requests
- **Security headers**: Helmet middleware for enhanced security
- **Input validation**: Server-side validation for all endpoints
- **SQL injection prevention**: Parameterized queries throughout

## 🏗️ Development

### Architecture Principles
- **Modular design**: Separated concerns with clear component boundaries
- **Environment-based config**: Different settings for dev/prod environments
- **Error handling**: Comprehensive error catching and user feedback
- **Clean code**: Consistent formatting and naming conventions
- **Responsive UI**: Mobile-first design approach

### Key Components
- **Dashboard**: Statistics overview with quick actions
- **Tenant Management**: Full CRUD operations with form validation
- **Receipt Generation**: PDF creation with French formatting
- **Receipt Management**: Advanced search, filter, and sort capabilities
- **Notifications**: Real-time user feedback system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

**ImmoFacile - Made with ❤️ for French property management**

# Rent Receipt Management System

A modern fullstack web application for property managers to handle tenant information and generate rent receipts.

## Features

- **Tenant Management**: Add, edit, delete, and view tenant information
- **Receipt Generation**: Create PDF rent receipts in French ("Quittance de Loyer")
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Updates**: Redux state management with notifications
- **Secure Backend**: Express.js with SQLite database, rate limiting, and security headers

## Tech Stack

### Backend
- Node.js with Express.js
- SQLite database
- PDFKit for PDF generation
- Security middleware (Helmet, CORS, Rate limiting)
- Environment-based configuration

### Frontend
- React 18 with Vite
- Redux Toolkit for state management
- Tailwind CSS for styling
- Heroicons for icons
- Axios for API calls

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

## Getting Started

### Backend Setup
1. Navigate to server directory: `cd server`
2. Install dependencies: `npm install`
3. Start the server: `npm start` or `npm run dev` for development
4. Server runs on http://localhost:5002

### Frontend Setup
1. Navigate to client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Client runs on http://localhost:3000

## API Endpoints

### Tenants
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Receipts
- `POST /api/receipts/generate` - Generate new receipt
- `GET /api/receipts` - Get all receipts
- `GET /api/receipts/tenant/:tenantId` - Get receipts by tenant
- `GET /api/receipts/download/:id` - Download receipt PDF
- `DELETE /api/receipts/:id` - Delete receipt

## Environment Variables

### Server (.env)
```
PORT=5002
NODE_ENV=development
DB_PATH=./database/rentReceipts.db
RECEIPTS_DIR=./receipts
CORS_ORIGIN=http://localhost:3000
```

### Client (.env)
```
VITE_API_URL=http://localhost:5002/api
```

## Features Overview

1. **Dashboard**: Overview with statistics and quick actions
2. **Tenant Management**: Complete CRUD operations for tenants
3. **Receipt Generation**: Generate French rent receipts as PDF
4. **File Management**: Download and manage generated receipts
5. **Notifications**: Real-time feedback for user actions
6. **Responsive Design**: Works on desktop and mobile devices

## Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Security headers with Helmet
- Input validation
- SQL injection prevention with parameterized queries

## Development

The application follows modern development practices:
- Modular architecture
- Environment-based configuration
- Error handling and logging
- Clean code structure
- Responsive UI components

# Wakaruku Petrol Station Management System - Frontend

This is the React frontend for the Wakaruku Petrol Station Management System.

## Features

- **Authentication**: Secure login system with JWT tokens
- **Dashboard**: Overview of sales, deliveries, expenses, and credit
- **Shift Management**: Track and manage shift reports
- **Delivery Management**: Record and track fuel deliveries
- **Credit Management**: Handle credit sales and payments
- **Expense Tracking**: Record and categorize business expenses
- **Reports**: Generate various business reports
- **Settings**: Configure station settings and preferences

## Tech Stack

- React 18
- TypeScript
- React Router v6
- Tailwind CSS
- React Hot Toast
- Axios

## Project Structure

```
src/
├── components/
│   ├── Navbar.js          # Navigation bar component
│   ├── Sidebar.js         # Sidebar navigation
│   └── ProtectedRoute.js  # Route protection wrapper
├── pages/
│   ├── Login.js          # Login page
│   ├── Dashboard.js      # Main dashboard
│   ├── ShiftReport.js    # Shift management
│   ├── Delivery.js       # Delivery tracking
│   ├── Credit.js         # Credit management
│   ├── Expenses.js       # Expense tracking
│   ├── Reports.js        # Report generation
│   └── Settings.js       # System settings
├── utils/
│   ├── api.js           # API client with axios
│   └── auth.js          # Authentication utilities
├── App.tsx              # Main application component
└── index.tsx            # Application entry point
```

## Installation

### Create React App Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Create React App:
   ```bash
   npx create-react-app .
   ```

3. Install dependencies:
   ```bash
   npm install react-router-dom axios chart.js react-chartjs-2 date-fns
   ```

4. Copy all the code above into their respective files in the src/ directory.

5. Update `public/index.html`:
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title>Wakaruku Petrol Station</title>
     </head>
     <body>
       <noscript>You need to enable JavaScript to run this app.</noscript>
       <div id="root"></div>
     </body>
   </html>
   ```

6. Start the app:
   ```bash
   npm start
   ```

### Quick Start (Already Set Up)

If the project is already set up, simply:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## API Integration

The frontend communicates with the backend API located at `http://localhost:5000/api` by default. Make sure the backend server is running before starting the frontend.

## Authentication

The application uses JWT tokens for authentication. Users must log in to access protected routes. The token is stored in localStorage and automatically included in API requests.

## Styling

The application uses Tailwind CSS for styling. The design follows a clean, professional look suitable for a business management system.

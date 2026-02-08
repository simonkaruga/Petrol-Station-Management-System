# Monthly Shift Report Feature

## Overview
The Monthly Shift Report displays all daily shifts for a selected month in an Excel-like table with automatic totals and profit calculations.

## Setup

### 1. Add Missing Database Columns
Run this command to add the new columns to the shifts table:

```bash
cd backend
node migrate-shifts.js
```

### 2. Access the Report
1. Start the application (backend on port 5000, frontend on port 3003)
2. Login with your credentials
3. Click "Monthly Report" in the sidebar
4. Select a month using the date picker
5. View all shifts for that month with totals

## Features

### Excel-Like Table
- Date and attendant for each shift
- Fuel sold (Petrol, Diesel, Kerosene) in liters
- Individual profit per fuel type
- Total money collected per shift
- Total profit per shift

### Monthly Totals Row
- Total shifts count
- Total fuel sold (all types)
- Total money collected (all payments)
- Total profit (fuel + services + gas)

### Summary Cards
- Total Shifts
- Total Fuel Sold (liters)
- Total Money Collected (KES)
- Total Profit (KES)

### Print Functionality
- Click "Print Report" button to print the monthly report
- Professional layout optimized for printing

## How It Works

### Data Flow
1. Frontend requests shifts for selected month: `GET /api/shifts?month=2024-01`
2. Backend filters shifts by createdAt date within the month
3. Frontend calculates:
   - Fuel sold = Closing - Opening readings
   - Fuel profit = (Sell Price - Buy Price) × Liters Sold
   - Services profit = 50% of car wash + parking fees
   - Gas profit = 20% of gas sales
4. Displays all shifts in table with totals

### Automatic Updates
- Every time you save a shift report, it's automatically included in the monthly report
- Select the current month to see today's shifts
- Historical data available by selecting previous months

## Usage Example

1. **Record Daily Shifts**: Use "Record Shift" page to save daily shift data
2. **View Monthly Summary**: Go to "Monthly Report" page
3. **Select Month**: Choose month from date picker (defaults to current month)
4. **Analyze Data**: Review fuel sales, profits, and totals
5. **Print Report**: Click print button for physical copy

## Navigation
- **Sidebar**: Click "Monthly Report" (📅 icon)
- **URL**: http://localhost:3003/monthly-report

## Data Displayed

### Per Shift
- Date (DD/MM/YYYY format)
- Attendant name
- Petrol sold and profit
- Diesel sold and profit
- Kerosene sold and profit
- Total money collected
- Total profit

### Monthly Totals
- Sum of all shifts
- Aggregated fuel quantities
- Aggregated profits
- Aggregated money collected

## Color Coding
- Profit values: Green (#10b981)
- Total profit: Purple (#667eea)
- Totals row: Purple gradient background
- Alternating row colors for readability

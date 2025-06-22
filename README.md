# Trading Journal Dashboard

A modern, web-based trading journal application designed to help traders track, analyze, and improve their trading performance. This application focuses on closed positions analysis with an intuitive calendar interface and comprehensive statistics.

![Trading Journal Dashboard](https://img.shields.io/badge/Node.js-18+-green) ![Trading Journal Dashboard](https://img.shields.io/badge/SQLite-Database-blue) ![Trading Journal Dashboard](https://img.shields.io/badge/Express.js-Server-red)

## 🚀 Features

### 📊 **Calendar View**
- **Visual P&L Calendar**: Interactive monthly calendar showing daily trading performance
- **Color-coded Days**: 
  - 🟢 Green for profitable trading days
  - 🔴 Red for loss days
  - 🔵 Blue for today's date
  - ⚪ Gray for no trading activity
- **Daily P&L Display**: Hover over any day to see exact profit/loss amounts
- **Month Navigation**: Easy navigation between months with arrow controls

### 📈 **Trading Statistics**
- **Total P&L**: Overall profit/loss across all trades
- **Win Rate**: Percentage of winning trades
- **Trade Counts**: Total, winning, and losing trade statistics
- **Average Performance**: Average win and loss amounts
- **Best/Worst Trades**: Highest profit and biggest loss tracking
- **Real-time Updates**: Statistics update automatically when new data is uploaded

### 📁 **Data Management**
- **CSV Upload**: Easy drag-and-drop or click-to-upload CSV functionality
- **Multiple Closure Handling**: Properly handles positions closed in multiple parts
- **Data Validation**: Automatic validation and cleaning of uploaded trading data
- **Database Storage**: Persistent SQLite database for reliable data storage
- **Clear Database**: One-click database clearing for fresh starts

### 🎨 **User Interface**
- **Modern Design**: Clean, professional interface with glassmorphism effects
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Dark Theme**: Easy-on-the-eyes dark color scheme
- **Smooth Animations**: Polished hover effects and transitions
- **Intuitive Navigation**: All controls easily accessible in the header

## 🛠️ Installation

### Prerequisites
- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/parkerlj15/Trading_-Journal.git
   cd Trading_-Journal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   node server.js
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Usage Guide

### 1. **Uploading Trading Data**

#### CSV Format Requirements
Your CSV file must contain the following columns:
- `symbol`: Trading symbol (e.g., AAPL, TSLA)
- `opening_ref`: Unique reference for the opening trade
- `closing_ref`: Unique reference for the closing trade
- `opened`: Opening date (YYYY-MM-DD format)
- `closed`: Closing date (YYYY-MM-DD format)
- `pnl`: Profit/Loss amount (numeric)

#### Example CSV Structure:
```csv
symbol,opening_ref,closing_ref,opened,closed,pnl
AAPL,REF001,REF002,2024-01-15,2024-01-16,150.50
TSLA,REF003,REF004,2024-01-16,2024-01-17,-75.25
MSFT,REF005,REF006,2024-01-17,2024-01-18,200.00
```

#### Upload Process:
1. Click the **"Upload CSV"** button in the header
2. Select your CSV file from your computer
3. Wait for the upload confirmation
4. Your data will automatically appear in the calendar and statistics

### 2. **Navigating the Calendar**

- **Month Navigation**: Use the left/right arrow buttons to navigate between months
- **Daily Details**: Click on any day with trading activity to see individual trade details
- **Color Legend**: Reference the legend in the header to understand day colors
- **P&L Amounts**: Daily P&L amounts are displayed directly on calendar days

### 3. **Understanding Statistics**

The statistics panel provides comprehensive trading metrics:

- **Total P&L**: Your overall trading performance
- **Win Rate**: Percentage calculated as (Winning Trades / Total Trades) × 100
- **Trade Counts**: Breakdown of total, winning, and losing trades
- **Averages**: Average win and loss amounts help identify trading patterns
- **Extremes**: Best and worst trades highlight your biggest successes and failures

### 4. **Managing Data**

- **Clear Database**: Use the red "Clear Database" button to remove all trading data
- **Data Persistence**: Your data is automatically saved in a SQLite database
- **Multiple Uploads**: You can upload multiple CSV files - data will be combined

## 🏗️ Technical Architecture

### Backend
- **Node.js & Express.js**: RESTful API server
- **SQLite**: Lightweight, file-based database
- **Multer**: File upload handling
- **CSV Processing**: Custom CSV parsing and validation

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **Modern CSS**: Glassmorphism design with CSS Grid/Flexbox
- **Responsive Design**: Mobile-first approach
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Key API Endpoints
- `POST /api/upload`: Upload and process CSV files
- `GET /api/statistics`: Retrieve trading statistics
- `GET /api/daily-stats/:year/:month`: Get calendar data for specific month
- `DELETE /api/clear-database`: Clear all trading data

## 📊 Data Processing Logic

### Trade Grouping
The application intelligently handles complex trading scenarios:

1. **Multiple Closures**: When a position is closed in multiple parts, each closure appears separately in the calendar
2. **Statistics Calculation**: For win/loss statistics, multiple closures of the same position (same opening_ref + opened date) are treated as one trade
3. **P&L Aggregation**: Daily P&L values are the sum of all trades closed on that day

### Example Scenario:
```
Position: 100 shares of AAPL opened on 2024-01-15
- Closure 1: 50 shares closed on 2024-01-16 (+$100)
- Closure 2: 50 shares closed on 2024-01-17 (+$50)

Calendar Display:
- Jan 16: +$100
- Jan 17: +$50

Statistics:
- Counted as 1 winning trade (total +$150)
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for custom configuration:
```env
PORT=3000
DB_PATH=./trading_journal.db
UPLOAD_DIR=./uploads
```

### Database Schema
The application creates the following table structure:
```sql
CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    opening_ref TEXT NOT NULL,
    closing_ref TEXT NOT NULL,
    opened DATE NOT NULL,
    closed DATE NOT NULL,
    pnl REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚨 Troubleshooting

### Common Issues

**1. "Port already in use" error**
```bash
# Kill existing processes on port 3000
pkill -f "node server.js"
# Then restart
node server.js
```

**2. CSV upload fails**
- Ensure your CSV has all required columns
- Check date format (YYYY-MM-DD)
- Verify P&L values are numeric
- File size should be under 10MB

**3. Database issues**
```bash
# Reset database by deleting the file
rm trading_journal.db
# Restart the application
node server.js
```

## 🔮 Future Enhancements

- **Trade Notes**: Add ability to attach notes and images to trades
- **Strategy Tracking**: Categorize trades by strategy
- **Advanced Analytics**: Risk metrics, drawdown analysis, and performance trends
- **Export Features**: Export data to Excel, PDF reports
- **Multi-timeframe Views**: Weekly, quarterly, and yearly calendar views
- **Trade Alerts**: Set up performance alerts and notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies for optimal performance
- Designed with trader workflow and usability in mind
- Inspired by the need for simple, effective trading analysis tools

---

**Happy Trading! 📈**

For questions or support, please open an issue on GitHub.

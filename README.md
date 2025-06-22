# 📈 Advanced Trading Journal Application

A comprehensive, modern web-based trading journal application that helps traders track, analyze, and visualize their trading performance with an intuitive calendar view and detailed statistics.

![Trading Journal Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📅 **Interactive Calendar View**
- **Visual Trading Days**: Green tiles for profitable days, red tiles for loss days
- **P&L Display**: Shows profit/loss amounts directly in calendar tiles
- **Clickable Days**: Click any trading day to see detailed trade information
- **Monthly Navigation**: Easy navigation between months
- **Today Highlighting**: Current date clearly marked

### 📊 **Comprehensive Statistics Dashboard**
- **Total P&L**: Overall trading performance
- **Win Rate**: Percentage of winning trades
- **Trade Counts**: Total, winning, and losing trades
- **Average Performance**: Average win and loss amounts
- **Best/Worst Trades**: Track your highest and lowest performing trades
- **Open Positions**: Real-time tracking of current positions

### 📁 **Automated CSV Processing**
- **Drag & Drop Upload**: Easy file upload interface
- **Automatic Data Cleaning**: Python-powered CSV processing
- **Progress Tracking**: Real-time upload and processing status
- **Error Handling**: Comprehensive error reporting and validation
- **Multiple Format Support**: Handles various CSV formats from trading platforms

### 🔧 **Position Management**
- **Edit Positions**: Modify entry prices and quantities
- **Close Positions**: Manually close open positions
- **Real-time Updates**: Changes reflect immediately across the interface
- **Confirmation Dialogs**: Prevent accidental actions
- **Success Notifications**: Visual feedback for all actions

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Glassmorphism Effects**: Modern, professional appearance
- **Smooth Animations**: Polished user interactions
- **Dark/Light Themes**: Gradient backgrounds with high contrast
- **Intuitive Navigation**: Tab-based interface for easy access

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python 3** (for CSV processing)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/parkerlj15/appv2.git
   cd appv2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📖 How to Use

### 1. **Dashboard Overview**
- The main dashboard displays your trading calendar and statistics
- Navigate between months using the arrow buttons
- View your overall trading performance in the statistics panel

### 2. **Uploading Trading Data**
- Click the "Automated Insights" tab
- Drag and drop your CSV file or click "Browse Files"
- The system automatically processes and imports your trades
- Watch the progress bar for real-time status updates

### 3. **Viewing Trade Details**
- Click on any colored day in the calendar
- See detailed information about all trades closed on that date
- View entry/exit prices, P&L, and trade references

### 4. **Managing Open Positions**
- Click "View All Open Positions" to see current trades
- Use the "Edit" button to modify position details
- Use the "Close Position" button to manually close trades
- All changes update statistics and calendar in real-time

## 🏗️ Technical Architecture

### **Backend (Node.js + Express)**
- **RESTful API**: Clean, organized endpoints for all operations
- **SQLite Database**: Lightweight, file-based database for trade storage
- **File Upload Handling**: Multer middleware for CSV processing
- **Data Validation**: Comprehensive input validation and error handling

### **Frontend (Vanilla JavaScript)**
- **Modern ES6+**: Clean, modular JavaScript architecture
- **Responsive CSS**: Mobile-first design with CSS Grid and Flexbox
- **Interactive Calendar**: Custom calendar implementation with click handlers
- **Real-time Updates**: Fetch API for seamless data synchronization

### **Data Processing (Python)**
- **CSV Cleaning**: Automated data cleaning and validation
- **Format Standardization**: Converts various CSV formats to consistent structure
- **Error Detection**: Identifies and reports data quality issues

## 📁 Project Structure

```
trading_app/
├── server.js              # Main Node.js server
├── package.json           # Dependencies and scripts
├── csv_cleaner.py         # Python CSV processing script
├── trading_journal.db     # SQLite database (auto-created)
├── public/
│   ├── index.html         # Main HTML interface
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # CSS styling
├── uploads/              # Temporary file storage
└── README.md            # This file
```

## 🔌 API Endpoints

### **Statistics**
- `GET /api/statistics` - Get comprehensive trading statistics
- `GET /api/daily-stats` - Get daily P&L data for calendar

### **Trades**
- `GET /api/trades` - Get all trades
- `GET /api/trades-by-date/:date` - Get trades for specific date
- `POST /api/upload-csv` - Upload and process CSV file

### **Positions**
- `GET /api/open-positions` - Get all open positions
- `PUT /api/update-position/:id` - Update position details
- `POST /api/close-position/:id` - Close a position

## 📊 Database Schema

### **Trades Table**
```sql
CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    closing_ref TEXT,           -- Trade closing reference
    closed TEXT,               -- Closing date/time
    opening_ref TEXT,          -- Trade opening reference
    opened TEXT,               -- Opening date/time
    market TEXT,               -- Market/instrument name
    size REAL,                 -- Position size
    opening_price REAL,        -- Entry price
    closing_price REAL,        -- Exit price
    pnl REAL,                  -- Profit/Loss amount
    total REAL,                -- Total P&L including fees
    trade_date TEXT,           -- Trade date (YYYY-MM-DD)
    is_open BOOLEAN,           -- Whether position is open
    created_at DATETIME        -- Record creation timestamp
);
```

## 🎯 CSV File Format

The application expects CSV files with the following columns:
1. **Closing Reference** - Unique identifier for trade closure
2. **Closed** - Closing date and time
3. **Opening Reference** - Unique identifier for trade opening
4. **Opened** - Opening date and time
5. **Market** - Trading instrument name
6. **Size** - Position size
7. **Opening Price** - Entry price
8. **Closing Price** - Exit price
9. **P&L** - Profit/Loss amount
10. **Total** - Total P&L including fees

### **Example CSV Row**
```csv
NAAVHCAB,29-05-2025 09:36:05,MY2WRQAM,27-05-2025 21:03:24,Tesla Motors Inc,0.01,36304.0,36670.0,3.66,3.52
```

## 🛠️ Development

### **Running in Development Mode**
```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Start with auto-restart
npm run dev
```

### **Database Management**
```bash
# View database contents
sqlite3 trading_journal.db ".tables"
sqlite3 trading_journal.db "SELECT * FROM trades LIMIT 5;"

# Reset database (caution: deletes all data)
rm trading_journal.db
```

### **Adding New Features**
1. **Backend**: Add new routes in `server.js`
2. **Frontend**: Update `app.js` for new functionality
3. **Styling**: Modify `styles.css` for visual changes
4. **Database**: Update schema in the table creation section

## 🔧 Configuration

### **Environment Variables**
```bash
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production         # Environment mode
```

### **Customization Options**
- **Currency Format**: Modify `formatCurrency()` in `app.js`
- **Date Format**: Update date formatting functions
- **Color Scheme**: Adjust CSS variables in `styles.css`
- **Calendar Layout**: Modify calendar grid in CSS

## 🚨 Troubleshooting

### **Common Issues**

1. **Server won't start**
   ```bash
   # Check if port is in use
   lsof -i :3000
   
   # Kill existing process
   pkill -f "node server.js"
   ```

2. **CSV upload fails**
   - Ensure Python 3 is installed and accessible
   - Check CSV file format matches expected structure
   - Verify file permissions in uploads directory

3. **Database errors**
   - Check if SQLite is properly installed
   - Ensure write permissions in project directory
   - Try deleting and recreating the database

4. **Calendar not showing trades**
   - Verify trades have proper closing dates
   - Check date format in database
   - Ensure daily stats API is returning data

## 📈 Performance Optimization

- **Database Indexing**: Add indexes for frequently queried columns
- **Caching**: Implement Redis for session management
- **File Compression**: Enable gzip compression for static files
- **CDN**: Use CDN for static assets in production

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated and sanitized
- **File Upload Security**: Restricted file types and size limits
- **SQL Injection Prevention**: Parameterized queries used throughout
- **CORS Configuration**: Properly configured for production use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chart.js** - For potential future charting features
- **Font Awesome** - For beautiful icons
- **SQLite** - For reliable data storage
- **Express.js** - For robust web server framework

## 📞 Support

For support, email [your-email@example.com] or create an issue in the GitHub repository.

---

**Built with ❤️ for traders, by traders**

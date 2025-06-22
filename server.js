const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize SQLite database
const db = new sqlite3.Database('trading_journal.db');

// Create tables
db.serialize(() => {
    // Trades table
    db.run(`CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        closing_ref TEXT,
        closed TEXT,
        opening_ref TEXT,
        opened TEXT,
        market TEXT,
        size REAL,
        opening_price REAL,
        closing_price REAL,
        pnl REAL,
        total REAL,
        trade_date TEXT,
        is_open BOOLEAN DEFAULT 0,
        image_path TEXT,
        trade_notes TEXT,
        strategy TEXT,
        custom_strategy TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Add new columns to existing table if they don't exist
    db.run(`ALTER TABLE trades ADD COLUMN image_path TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding image_path column:', err);
        }
    });
    
    db.run(`ALTER TABLE trades ADD COLUMN trade_notes TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding trade_notes column:', err);
        }
    });

    // Add strategy columns
    db.run(`ALTER TABLE trades ADD COLUMN strategy TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding strategy column:', err);
        }
    });
    
    db.run(`ALTER TABLE trades ADD COLUMN custom_strategy TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding custom_strategy column:', err);
        }
    });

    // Daily statistics table
    db.run(`CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        total_pnl REAL,
        trade_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// API Routes

// Get all trades
app.get('/api/trades', (req, res) => {
    db.all('SELECT * FROM trades ORDER BY opened DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get trading statistics
app.get('/api/statistics', (req, res) => {
    // Get only closed trades for statistics
    db.all('SELECT * FROM trades WHERE closing_ref != "OPEN" AND closed IS NOT NULL AND closed != ""', (err, closedTrades) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Group trades by opening_ref and opening date to handle multiple closures as one trade for statistics
        const tradesByOpeningRef = {};
        closedTrades.forEach(trade => {
            const key = `${trade.opening_ref}_${trade.opened}`;
            if (!tradesByOpeningRef[key]) {
                tradesByOpeningRef[key] = {
                    totalPnL: 0,
                    trades: [],
                    opening_ref: trade.opening_ref,
                    opened: trade.opened
                };
            }
            tradesByOpeningRef[key].totalPnL += trade.total || 0;
            tradesByOpeningRef[key].trades.push(trade);
        });

        // Calculate statistics based on unique trades (grouped by opening_ref and date)
        const uniqueTrades = Object.values(tradesByOpeningRef);
        const winningTrades = uniqueTrades.filter(trade => trade.totalPnL > 0);
        const losingTrades = uniqueTrades.filter(trade => trade.totalPnL < 0);
        
        const stats = {
            totalPnL: uniqueTrades.reduce((sum, t) => sum + t.totalPnL, 0),
            bestTrade: Math.max(...uniqueTrades.map(t => t.totalPnL), 0),
            worstTrade: Math.min(...uniqueTrades.map(t => t.totalPnL), 0),
            totalTrades: uniqueTrades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: uniqueTrades.length > 0 ? (winningTrades.length / uniqueTrades.length) * 100 : 0,
            averageWin: winningTrades.length > 0 ? 
                winningTrades.reduce((sum, t) => sum + t.totalPnL, 0) / winningTrades.length : 0,
            averageLoss: losingTrades.length > 0 ? 
                losingTrades.reduce((sum, t) => sum + t.totalPnL, 0) / losingTrades.length : 0
        };

        res.json(stats);
    });
});

// Open positions endpoint removed - focusing only on closed positions

// Get daily statistics for calendar
app.get('/api/daily-stats', (req, res) => {
    db.all(`
        SELECT 
            SUBSTR(closed, 7, 4) || '-' || SUBSTR(closed, 4, 2) || '-' || SUBSTR(closed, 1, 2) as date,
            SUM(total) as daily_pnl,
            COUNT(*) as trade_count
        FROM trades 
        WHERE closing_ref != 'OPEN' AND closed IS NOT NULL AND closed != ''
        GROUP BY SUBSTR(closed, 7, 4) || '-' || SUBSTR(closed, 4, 2) || '-' || SUBSTR(closed, 1, 2)
        ORDER BY date
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get trades for a specific date
app.get('/api/trades-by-date/:date', (req, res) => {
    const date = req.params.date;
    db.all(`
        SELECT * FROM trades 
        WHERE closing_ref != 'OPEN' 
        AND SUBSTR(closed, 7, 4) || '-' || SUBSTR(closed, 4, 2) || '-' || SUBSTR(closed, 1, 2) = ?
        ORDER BY closed
    `, [date], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Upload and process CSV
app.post('/api/upload-csv', upload.single('csvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputFile = req.file.path;
    const outputFile = `${inputFile}_cleaned.csv`;

    // Run Python CSV cleaner
    exec(`python3 csv_cleaner.py "${inputFile}" "${outputFile}"`, (error, stdout, stderr) => {
        if (error) {
            console.error('CSV Cleaner Error:', error);
            return res.status(500).json({ error: 'Failed to clean CSV file' });
        }

        // Read cleaned CSV and insert into database
        fs.readFile(outputFile, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to read cleaned CSV' });
            }

            // Helper function to parse numbers that might be quoted and contain commas
            const parseNumber = (value) => {
                if (!value) return 0;
                // Remove quotes and commas, then parse
                const cleanValue = value.toString().replace(/[",]/g, '');
                return parseFloat(cleanValue) || 0;
            };
            
            // Parse CSV data properly
            const lines = data.trim().split('\n');
            const csvTrades = [];
            
            for (let i = 1; i < lines.length; i++) {
                // Use a simple CSV parser that handles quoted values
                const values = [];
                let current = '';
                let inQuotes = false;
                
                for (let j = 0; j < lines[i].length; j++) {
                    const char = lines[i][j];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim()); // Add the last value
                
                if (values.length >= 9) {
                    const trade = {
                        closing_ref: values[0] || '',
                        closed: values[1] || '',
                        opening_ref: values[2] || '',
                        opened: values[3] || '',
                        market: values[4] || '',
                        size: 0, // Size not in cleaned CSV
                        opening_price: parseNumber(values[5]), // Opening price
                        closing_price: parseNumber(values[6]), // Closing price
                        pnl: parseNumber(values[7]), // P/L column
                        total: parseNumber(values[8]), // Total column
                        trade_date: values[3] ? values[3].split(' ')[0] : ''
                    };
                    
                    csvTrades.push(trade);
                }
            }

            // Only process closed trades - ignore open positions
            const processedTrades = csvTrades.filter(t => 
                t.closing_ref !== 'OPEN' && t.closed && t.closed !== '' && t.closed !== '-'
            ).map(trade => ({
                ...trade,
                is_open: false
            }));

            // Process closed trades only
            let processedCount = 0;
            let newTradesCount = 0;
            let skippedClosedTradesCount = 0;
            const totalTrades = processedTrades.length;

            if (totalTrades === 0) {
                // Clean up temporary files
                fs.unlink(inputFile, () => {});
                fs.unlink(outputFile, () => {});
                
                res.json({ 
                    message: 'CSV processed successfully - no closed trades found', 
                    newTrades: 0,
                    skippedClosedTrades: 0
                });
                return;
            }

            processedTrades.forEach(csvTrade => {
                // Check if this exact trade already exists (using opening_ref + closing_ref + closed date)
                db.get(`SELECT * FROM trades WHERE opening_ref = ? AND closing_ref = ? AND closed = ?`, 
                    [csvTrade.opening_ref, csvTrade.closing_ref, csvTrade.closed], (err, existingTrade) => {
                    if (err) {
                        console.error('Database query error:', err);
                        processedCount++;
                        checkCompletion();
                        return;
                    }

                    if (existingTrade) {
                        console.log(`Skipping existing closed trade: ${csvTrade.opening_ref} closed on ${csvTrade.closed}`);
                        skippedClosedTradesCount++;
                        processedCount++;
                        checkCompletion();
                    } else {
                        // Add new closed trade
                        db.run(`INSERT INTO trades (
                            closing_ref, closed, opening_ref, opened, market, size, 
                            opening_price, closing_price, pnl, total, trade_date, is_open
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                            csvTrade.closing_ref, csvTrade.closed, csvTrade.opening_ref, csvTrade.opened,
                            csvTrade.market, csvTrade.size, csvTrade.opening_price, csvTrade.closing_price,
                            csvTrade.pnl, csvTrade.total, csvTrade.trade_date, csvTrade.is_open
                        ], function(insertErr) {
                            if (insertErr) {
                                console.error('Database insert error:', insertErr);
                            } else {
                                console.log(`Added new closed trade: ${csvTrade.opening_ref} closed on ${csvTrade.closed}`);
                                newTradesCount++;
                            }
                            processedCount++;
                            checkCompletion();
                        });
                    }
                });
            });

            function checkCompletion() {
                if (processedCount === totalTrades) {
                    // Clean up temporary files
                    fs.unlink(inputFile, () => {});
                    fs.unlink(outputFile, () => {});
                    
                    console.log(`CSV Processing Complete:
                        - New trades added: ${newTradesCount}
                        - Closed trades skipped: ${skippedClosedTradesCount}
                        - Total processed: ${totalTrades}`);
                    
                    res.json({ 
                        message: 'CSV processed successfully', 
                        newTrades: newTradesCount,
                        skippedClosedTrades: skippedClosedTradesCount,
                        totalProcessed: totalTrades
                    });
                }
            }

            // Complex opening reference logic removed - focusing only on closed positions
        });
    });
});

// Upload trade image
app.post('/api/upload-trade-image/:id', upload.single('tradeImage'), (req, res) => {
    const tradeId = req.params.id;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Move file to public/uploads with a better name
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `trade_${tradeId}_${Date.now()}${fileExtension}`;
    const finalPath = path.join(uploadsDir, fileName);
    const relativePath = `uploads/${fileName}`;

    fs.rename(req.file.path, finalPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save image' });
        }

        // Update database with image path
        db.run(`UPDATE trades SET image_path = ? WHERE id = ?`, [relativePath, tradeId], function(dbErr) {
            if (dbErr) {
                res.status(500).json({ error: dbErr.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Trade not found' });
                return;
            }
            res.json({ message: 'Image uploaded successfully', imagePath: relativePath });
        });
    });
});

// Update trade notes
app.put('/api/update-trade-notes/:id', (req, res) => {
    const tradeId = req.params.id;
    const { notes } = req.body;
    
    db.run(`UPDATE trades SET trade_notes = ? WHERE id = ?`, [notes, tradeId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Trade not found' });
            return;
        }
        res.json({ message: 'Trade notes updated successfully' });
    });
});

// Update trade strategy
app.put('/api/update-trade-strategy/:id', (req, res) => {
    const tradeId = req.params.id;
    const { strategy, customStrategy } = req.body;
    
    db.run(`UPDATE trades SET strategy = ?, custom_strategy = ? WHERE id = ?`, [strategy, customStrategy, tradeId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Trade not found' });
            return;
        }
        res.json({ message: 'Trade strategy updated successfully' });
    });
});

// Delete trade image
app.delete('/api/delete-trade-image/:id', (req, res) => {
    const tradeId = req.params.id;
    
    // Get current image path
    db.get(`SELECT image_path FROM trades WHERE id = ?`, [tradeId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        const imagePath = row.image_path;
        if (imagePath) {
            // Delete file from filesystem
            const fullPath = path.join(__dirname, 'public', imagePath);
            fs.unlink(fullPath, (fsErr) => {
                if (fsErr && fsErr.code !== 'ENOENT') {
                    console.error('Error deleting image file:', fsErr);
                }
            });
        }

        // Remove image path from database
        db.run(`UPDATE trades SET image_path = NULL WHERE id = ?`, [tradeId], function(dbErr) {
            if (dbErr) {
                res.status(500).json({ error: dbErr.message });
                return;
            }
            res.json({ message: 'Image deleted successfully' });
        });
    });
});

// Opening reference logic endpoint removed - focusing only on closed positions

// Clear database for debugging
app.delete('/api/clear-database', (req, res) => {
    db.run('DELETE FROM trades', function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.run('DELETE FROM daily_stats', function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Database cleared successfully' });
        });
    });
});

// Shutdown endpoint
app.post('/api/shutdown', (req, res) => {
    console.log('🔴 Shutdown request received');
    res.json({ message: 'Server shutting down...' });
    
    // Close database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('📊 Database connection closed');
        }
        
        // Gracefully shutdown the server
        console.log('🛑 Trading Journal server shutting down...');
        process.exit(0);
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Trading Journal server running on http://localhost:${PORT}`);
    console.log(`📊 Database: trading_journal.db`);
    console.log(`📁 Static files: ./public/`);
}); 
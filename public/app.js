// Trading Journal Application JavaScript
class TradingJournal {
    constructor() {
        this.currentDate = new Date();
        this.dailyStats = [];
        this.statistics = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.renderCalendar();
    }

    setupEventListeners() {
        // No longer need tab navigation since we have a single page

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));

        // File upload
        const fileInput = document.getElementById('csvFileInput');
        const browseBtn = document.getElementById('browseBtn');

        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));

        // Modal functionality
        document.getElementById('closeModal').addEventListener('click', () => this.hidePositionsModal());
        
        // Close modal when clicking outside
        document.getElementById('positionsModal').addEventListener('click', (e) => {
            if (e.target.id === 'positionsModal') {
                this.hidePositionsModal();
            }
        });

        // Modal body event delegation for all buttons
        document.getElementById('modalBody').addEventListener('click', (e) => {
            const tradeId = e.target.closest('[data-trade-id]')?.dataset.tradeId;
            if (!tradeId) return;

            if (e.target.closest('.add-note')) {
                e.preventDefault();
                e.stopPropagation();
                this.showNotesModal(parseInt(tradeId));
            } else if (e.target.closest('.add-image')) {
                e.preventDefault();
                e.stopPropagation();
                this.showImageUpload(parseInt(tradeId));
            } else if (e.target.closest('.add-strategy')) {
                e.preventDefault();
                e.stopPropagation();
                this.showStrategyModal(parseInt(tradeId));
            } else if (e.target.closest('.delete-image-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.deleteTradeImage(parseInt(tradeId));
            }
        });

        // Clear database button listener
        const clearDbBtn = document.getElementById('clearDbBtn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear the database? This action cannot be undone.')) {
                    try {
                        const res = await fetch('/api/clear-database', { method: 'DELETE' });
                        const data = await res.json();
                        this.showNotification(data.message || 'Database cleared', 'success');
                        this.loadData();
                        this.renderCalendar();
                    } catch (err) {
                        console.error('Error clearing database:', err);
                        this.showNotification('Failed to clear database', 'error');
                    }
                }
            });
        }

        // Quit app button listener
        const quitAppBtn = document.getElementById('quitAppBtn');
        if (quitAppBtn) {
            quitAppBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to quit the application?')) {
                    try {
                        this.showNotification('Shutting down application...', 'success');
                        await fetch('/api/shutdown', { method: 'POST' });
                        // Close the browser tab/window
                        window.close();
                    } catch (err) {
                        console.error('Error shutting down application:', err);
                        this.showNotification('Failed to shutdown application', 'error');
                    }
                }
            });
        }
    }



    async loadData() {
        try {
            // Load statistics
            const statsResponse = await fetch('/api/statistics');
            this.statistics = await statsResponse.json();
            this.updateStatistics();

            // Load daily stats for calendar
            const dailyResponse = await fetch('/api/daily-stats');
            this.dailyStats = await dailyResponse.json();
            this.renderCalendar();

        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    updateStatistics() {
        const stats = this.statistics;
        
        // Update main statistics
        document.getElementById('totalPnL').textContent = this.formatCurrency(stats.totalPnL || 0);
        document.getElementById('totalPnL').className = `stat-value ${stats.totalPnL >= 0 ? 'positive' : 'negative'}`;
        
        document.getElementById('winRate').textContent = `${(stats.winRate || 0).toFixed(1)}%`;
        document.getElementById('totalTrades').textContent = stats.totalTrades || 0;
        document.getElementById('winningTrades').textContent = stats.winningTrades || 0;
        document.getElementById('losingTrades').textContent = stats.losingTrades || 0;
        
        document.getElementById('averageWin').textContent = this.formatCurrency(stats.averageWin || 0);
        document.getElementById('averageLoss').textContent = this.formatCurrency(stats.averageLoss || 0);
        document.getElementById('bestTrade').textContent = this.formatCurrency(stats.bestTrade || 0);
        document.getElementById('worstTrade').textContent = this.formatCurrency(stats.worstTrade || 0);
    }

    // Open positions functionality removed - focusing only on closed positions

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month display
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Clear calendar grid
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            dayHeader.style.cssText = `
                font-weight: 700;
                color: #666;
                text-align: center;
                padding: 8px;
                font-size: 12px;
            `;
            calendarGrid.appendChild(dayHeader);
        });

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Create day number element
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            // Check if this is today
            if (year === today.getFullYear() && 
                month === today.getMonth() && 
                day === today.getDate()) {
                dayElement.classList.add('today');
            }

            // Check for trading data on this day
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayStats = this.dailyStats.find(stat => stat.date === dateStr);
            
            if (dayStats && dayStats.daily_pnl !== 0) {
                // Create P&L display element
                const pnlElement = document.createElement('div');
                pnlElement.className = 'day-pnl';
                pnlElement.textContent = this.formatCurrency(dayStats.daily_pnl);
                dayElement.appendChild(pnlElement);

                if (dayStats.daily_pnl > 0) {
                    dayElement.classList.add('profitable');
                } else {
                    dayElement.classList.add('loss');
                }
                
                dayElement.title = `${dayStats.daily_pnl > 0 ? 'Profit' : 'Loss'}: ${this.formatCurrency(dayStats.daily_pnl)} (${dayStats.trade_count} trades)`;
                
                // Add click handler to show trade details
                dayElement.style.cursor = 'pointer';
                dayElement.addEventListener('click', () => this.showTradeDetails(dateStr, dayStats));
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    async handleFileUpload(file) {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showUploadResult('Please select a CSV file.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('csvFile', file);

        // Show progress
        this.showUploadProgress();

        try {
            const response = await fetch('/api/upload-csv', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showUploadResult(
                    `Successfully processed ${file.name}`,
                    'success',
                    `${result.recordsInserted} records imported`
                );
                
                // Reload data to update the interface
                await this.loadData();
            } else {
                this.showUploadResult(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showUploadResult('Upload failed. Please try again.', 'error');
        } finally {
            this.hideUploadProgress();
        }
    }

    showUploadProgress() {
        document.getElementById('uploadProgress').style.display = 'block';
        document.getElementById('uploadResults').style.display = 'none';
        
        // Simulate progress
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            progressFill.style.width = `${progress}%`;
            
            if (progress < 30) {
                progressText.textContent = 'Uploading file...';
            } else if (progress < 60) {
                progressText.textContent = 'Cleaning data...';
            } else {
                progressText.textContent = 'Processing trades...';
            }
        }, 200);

        // Store interval to clear it later
        this.uploadInterval = interval;
    }

    hideUploadProgress() {
        if (this.uploadInterval) {
            clearInterval(this.uploadInterval);
        }
        
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('progressFill').style.width = '100%';
    }

    showUploadResult(message, type, stats = '') {
        const resultsDiv = document.getElementById('uploadResults');
        const messageDiv = document.getElementById('resultMessage');
        const statsDiv = document.getElementById('resultStats');
        
        resultsDiv.className = `upload-results ${type}`;
        resultsDiv.style.display = 'block';
        
        messageDiv.className = `result-message ${type}`;
        messageDiv.textContent = message;
        
        statsDiv.textContent = stats;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                resultsDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Open positions modal removed - only used for trade details now

    hidePositionsModal() {
        document.getElementById('positionsModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    formatCurrency(amount) {
        // For spread betting - display £ per point without commas
        const value = (amount || 0).toFixed(2);
        return `£${value}`;
    }

    formatDate(dateString) {
        if (!dateString || dateString === '' || dateString === '-') return 'N/A';
        
        // Handle the DD-MM-YYYY HH:MM:SS format from the database
        let dateToFormat;
        
        // Check if it's in DD-MM-YYYY format (with or without time)
        const ddmmyyyyPattern = /^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+\d{1,2}:\d{1,2}:\d{1,2})?$/;
        const match = dateString.match(ddmmyyyyPattern);
        
        if (match) {
            // Convert DD-MM-YYYY to MM/DD/YYYY for proper Date parsing
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            dateToFormat = new Date(`${month}/${day}/${year}`);
        } else {
            // Try parsing as-is for other formats
            dateToFormat = new Date(dateString);
        }
        
        // Check if the date is valid
        if (isNaN(dateToFormat.getTime())) {
            console.warn(`Invalid date format: ${dateString}`);
            return 'Invalid Date';
        }
        
        return dateToFormat.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    async showTradeDetails(date, dayStats) {
        this.currentModalContext = 'trades';
        this.currentTradeDate = date;
        this.currentDayStats = dayStats;
        
        try {
            const response = await fetch(`/api/trades-by-date/${date}`);
            const trades = await response.json();
            
            const modal = document.getElementById('positionsModal');
            const modalBody = document.getElementById('modalBody');
            
            // Update modal header
            document.querySelector('#positionsModal .modal-header h3').textContent = 
                `Trades for ${this.formatDate(date)} - ${this.formatCurrency(dayStats.daily_pnl)}`;
            
            if (trades.length === 0) {
                modalBody.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <h3>No Trades Found</h3>
                        <p>No closed trades found for this date.</p>
                    </div>
                `;
            } else {
                modalBody.innerHTML = trades.map(trade => `
                    <div class="position-card" data-trade-id="${trade.id}">
                        <div class="position-header">
                            <div class="position-title">
                                <span class="company-name">${trade.market || 'Unknown Market'}</span>
                                <span class="position-date">Closed: ${this.formatDate(trade.closed)}</span>
                            </div>
                            <div class="position-actions">
                                <div class="trade-pnl ${trade.total >= 0 ? 'positive' : 'negative'}">
                                    ${this.formatCurrency(trade.total)}
                                </div>
                                <button class="action-btn add-note" data-trade-id="${trade.id}">
                                    <i class="fas fa-sticky-note"></i>
                                    ${trade.trade_notes ? 'Edit Note' : 'Add Note'}
                                </button>
                                <button class="action-btn add-image" data-trade-id="${trade.id}">
                                    <i class="fas fa-camera"></i>
                                    ${trade.image_path ? 'Change Image' : 'Add Image'}
                                </button>
                                <button class="action-btn add-strategy" data-trade-id="${trade.id}">
                                    <i class="fas fa-chess-knight"></i>
                                    ${trade.strategy ? 'Edit Strategy' : 'Add Strategy'}
                                </button>
                            </div>
                        </div>
                        <div class="position-details">
                            <div class="detail-item">
                                <span class="detail-label">Opening Ref:</span>
                                <span class="detail-value">${trade.opening_ref}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Closing Ref:</span>
                                <span class="detail-value">${trade.closing_ref}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Opened:</span>
                                <span class="detail-value">${this.formatDate(trade.opened)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Size:</span>
                                <span class="detail-value">${trade.size}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Entry Price:</span>
                                <span class="detail-value">${this.formatCurrency(trade.opening_price)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Exit Price:</span>
                                <span class="detail-value">${this.formatCurrency(trade.closing_price)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">P&L:</span>
                                <span class="detail-value ${trade.total >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(trade.total)}</span>
                            </div>
                            ${trade.strategy ? `
                                <div class="detail-item strategy-container">
                                    <span class="detail-label">Strategy:</span>
                                    <div class="strategy-info">
                                        <span class="strategy-name">${trade.strategy}</span>
                                        ${trade.strategy === 'OTHER' && trade.custom_strategy ? `
                                            <span class="custom-strategy">${trade.custom_strategy}</span>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}
                            ${trade.image_path ? `
                                <div class="detail-item trade-image-container">
                                    <span class="detail-label">Trade Image:</span>
                                    <div class="trade-image-wrapper">
                                        <img src="${trade.image_path}" alt="Trade Image" class="trade-image" onclick="this.classList.toggle('enlarged')">
                                        <button class="delete-image-btn" data-trade-id="${trade.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                            ${trade.trade_notes ? `
                                <div class="detail-item trade-notes-container">
                                    <span class="detail-label">Trade Notes:</span>
                                    <div class="trade-notes">${trade.trade_notes}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
            }
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('Error loading trade details:', error);
        }
    }

    showNotesModal(tradeId) {
        // Find the trade to get existing notes
        let existingNotes = '';
        const trade = [...this.openPositions, ...this.dailyStats].find(t => t.id === tradeId);
        if (trade && trade.trade_notes) {
            existingNotes = trade.trade_notes;
        }

        // Create notes modal
        const notesModal = document.createElement('div');
        notesModal.className = 'modal notes-modal active';
        notesModal.innerHTML = `
            <div class="modal-content notes-modal-content">
                <div class="modal-header">
                    <h3>Trade Notes</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="notes-form">
                        <label for="tradeNotes">Why did you take this trade?</label>
                        <textarea id="tradeNotes" placeholder="Enter your trade reasoning, analysis, emotions, lessons learned, etc..." rows="8">${existingNotes}</textarea>
                        <div class="form-actions">
                            <button class="save-notes-btn" data-trade-id="${tradeId}">
                                <i class="fas fa-save"></i>
                                Save Notes
                            </button>
                            <button class="cancel-notes-btn" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(notesModal);

        // Add event listener for save button
        notesModal.querySelector('.save-notes-btn').addEventListener('click', () => {
            this.saveTradeNotes(tradeId, notesModal);
        });
    }

    async saveTradeNotes(tradeId, modal) {
        const notesTextarea = modal.querySelector('#tradeNotes');
        const notes = notesTextarea.value.trim();

        try {
            const response = await fetch(`/api/update-trade-notes/${tradeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes })
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Trade notes saved successfully!', 'success');
                modal.remove();
                document.body.style.overflow = 'auto';
                
                // Refresh the data and modal
                await this.loadData();
                // Re-show the appropriate modal based on current context
                if (this.currentModalContext === 'positions') {
                    this.showPositionsModal();
                } else if (this.currentModalContext === 'trades') {
                    // Re-show trade details for the current date
                    this.showTradeDetails(this.currentTradeDate, this.currentDayStats);
                }
            } else {
                this.showNotification(result.error || 'Failed to save notes', 'error');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            this.showNotification('Error saving notes', 'error');
        }
    }

    showImageUpload(tradeId) {
        // Create image upload modal
        const imageModal = document.createElement('div');
        imageModal.className = 'modal image-modal active';
        imageModal.innerHTML = `
            <div class="modal-content image-modal-content">
                <div class="modal-header">
                    <h3>Upload Trade Image</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="image-upload-form">
                        <div class="upload-area-small" id="imageUploadArea">
                            <div class="upload-icon">
                                <i class="fas fa-camera"></i>
                            </div>
                            <h4>Upload Trade Screenshot</h4>
                            <p>Drag & drop an image or click to browse</p>
                            <input type="file" id="tradeImageInput" accept="image/*" style="display: none;">
                            <button type="button" class="upload-btn-small" onclick="document.getElementById('tradeImageInput').click();">
                                <i class="fas fa-upload"></i>
                                Choose Image
                            </button>
                        </div>
                        <div class="form-actions">
                            <button class="upload-image-btn" data-trade-id="${tradeId}" disabled>
                                <i class="fas fa-upload"></i>
                                Upload Image
                            </button>
                            <button class="cancel-image-btn" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(imageModal);

        const fileInput = imageModal.querySelector('#tradeImageInput');
        const uploadBtn = imageModal.querySelector('.upload-image-btn');
        const uploadArea = imageModal.querySelector('#imageUploadArea');

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                uploadBtn.disabled = false;
                uploadArea.style.borderColor = '#10b981';
                uploadArea.querySelector('p').textContent = `Selected: ${e.target.files[0].name}`;
            }
        });

        // Handle drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#10b981';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#6366f1';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                fileInput.files = files;
                uploadBtn.disabled = false;
                uploadArea.querySelector('p').textContent = `Selected: ${files[0].name}`;
            }
        });

        // Handle upload
        uploadBtn.addEventListener('click', () => {
            this.uploadTradeImage(tradeId, fileInput.files[0], imageModal);
        });
    }

    async uploadTradeImage(tradeId, file, modal) {
        if (!file) {
            this.showNotification('Please select an image', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('tradeImage', file);

        try {
            const response = await fetch(`/api/upload-trade-image/${tradeId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Image uploaded successfully!', 'success');
                modal.remove();
                document.body.style.overflow = 'auto';
                
                // Refresh the data and modal
                await this.loadData();
                // Re-show the appropriate modal based on current context
                if (this.currentModalContext === 'positions') {
                    this.showPositionsModal();
                } else if (this.currentModalContext === 'trades') {
                    this.showTradeDetails(this.currentTradeDate, this.currentDayStats);
                }
            } else {
                this.showNotification(result.error || 'Failed to upload image', 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showNotification('Error uploading image', 'error');
        }
    }

    async deleteTradeImage(tradeId) {
        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }

        try {
            const response = await fetch(`/api/delete-trade-image/${tradeId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Image deleted successfully!', 'success');
                
                // Refresh the data and modal
                await this.loadData();
                // Re-show the appropriate modal based on current context
                if (this.currentModalContext === 'positions') {
                    this.showPositionsModal();
                } else if (this.currentModalContext === 'trades') {
                    this.showTradeDetails(this.currentTradeDate, this.currentDayStats);
                }
            } else {
                this.showNotification(result.error || 'Failed to delete image', 'error');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            this.showNotification('Error deleting image', 'error');
        }
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    showStrategyModal(tradeId) {
        // Find the trade to get existing strategy
        let existingStrategy = '';
        let existingCustomStrategy = '';
        const trade = [...this.openPositions, ...this.dailyStats].find(t => t.id === tradeId);
        if (trade) {
            existingStrategy = trade.strategy || '';
            existingCustomStrategy = trade.custom_strategy || '';
        }

        // Create strategy modal
        const strategyModal = document.createElement('div');
        strategyModal.className = 'modal strategy-modal active';
        strategyModal.innerHTML = `
            <div class="modal-content strategy-modal-content">
                <div class="modal-header">
                    <h3>Trade Strategy</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="strategy-form">
                        <label for="strategySelect">Select Strategy:</label>
                        <select id="strategySelect" class="strategy-select">
                            <option value="">-- Select a Strategy --</option>
                            <option value="weekly BX" ${existingStrategy === 'weekly BX' ? 'selected' : ''}>Weekly BX</option>
                            <option value="daily BX" ${existingStrategy === 'daily BX' ? 'selected' : ''}>Daily BX</option>
                            <option value="OTHER" ${existingStrategy === 'OTHER' ? 'selected' : ''}>Other</option>
                        </select>
                        
                        <div class="custom-strategy-container" id="customStrategyContainer" style="display: ${existingStrategy === 'OTHER' ? 'block' : 'none'};">
                            <label for="customStrategy">Custom Strategy:</label>
                            <input type="text" id="customStrategy" placeholder="Enter your custom strategy..." value="${existingCustomStrategy}">
                        </div>
                        
                        <div class="form-actions">
                            <button class="save-strategy-btn" data-trade-id="${tradeId}">
                                <i class="fas fa-save"></i>
                                Save Strategy
                            </button>
                            <button class="cancel-strategy-btn" onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(strategyModal);

        // Handle strategy selection change
        const strategySelect = strategyModal.querySelector('#strategySelect');
        const customContainer = strategyModal.querySelector('#customStrategyContainer');
        
        strategySelect.addEventListener('change', (e) => {
            if (e.target.value === 'OTHER') {
                customContainer.style.display = 'block';
            } else {
                customContainer.style.display = 'none';
            }
        });

        // Add event listener for save button
        strategyModal.querySelector('.save-strategy-btn').addEventListener('click', () => {
            this.saveTradeStrategy(tradeId, strategyModal);
        });
    }

    async saveTradeStrategy(tradeId, modal) {
        const strategySelect = modal.querySelector('#strategySelect');
        const customStrategyInput = modal.querySelector('#customStrategy');
        
        const strategy = strategySelect.value;
        const customStrategy = strategy === 'OTHER' ? customStrategyInput.value.trim() : '';

        if (!strategy) {
            this.showNotification('Please select a strategy', 'error');
            return;
        }

        if (strategy === 'OTHER' && !customStrategy) {
            this.showNotification('Please enter a custom strategy', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/update-trade-strategy/${tradeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ strategy, customStrategy })
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Trade strategy saved successfully!', 'success');
                modal.remove();
                document.body.style.overflow = 'auto';
                
                // Refresh the data and modal
                await this.loadData();
                // Re-show the appropriate modal based on current context
                if (this.currentModalContext === 'positions') {
                    this.showPositionsModal();
                } else if (this.currentModalContext === 'trades') {
                    this.showTradeDetails(this.currentTradeDate, this.currentDayStats);
                }
            } else {
                this.showNotification(result.error || 'Failed to save strategy', 'error');
            }
        } catch (error) {
            console.error('Error saving strategy:', error);
            this.showNotification('Error saving strategy', 'error');
        }
    }
}

// Initialize the application when the DOM is loaded
let tradingJournal; // Global variable for onclick handlers

document.addEventListener('DOMContentLoaded', () => {
    tradingJournal = new TradingJournal();
});

// Add some utility functions for enhanced UX
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add loading animation to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            if (!this.classList.contains('loading')) {
                this.classList.add('loading');
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 1000);
            }
        });
    });
    
    // Add fade-in animation to elements as they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe all major sections
    document.querySelectorAll('.calendar-section, .stats-section, .upload-section').forEach(section => {
        observer.observe(section);
    });
}); 
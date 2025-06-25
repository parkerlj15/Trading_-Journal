/**
 * ModalManager - Handles all modal functionality
 */

class ModalManager {
    constructor(app) {
        this.app = app;
        this.currentModal = null;
        this.strategies = ['weekly BX', 'daily BX', 'OTHER'];
    }

    /**
     * Show trade details modal for a specific date
     */
    async showTradeDetails(date, dayStats) {
        try {
            const trades = await this.app.dataManager.getTradesForDate(date);
            
            if (!trades || trades.length === 0) {
                this.app.showNotification('No trades found for this date', 'error');
                return;
            }

            const modal = this.createModal('Trade Details', 'trade-details-modal');
            const modalBody = modal.querySelector('.modal-body');
            
            modalBody.innerHTML = this.generateTradeDetailsHTML(trades, date, dayStats);
            
            this.showModal(modal);
            
        } catch (error) {
            console.error('Error showing trade details:', error);
            this.app.showNotification('Failed to load trade details', 'error');
        }
    }

    /**
     * Generate HTML for trade details
     */
    generateTradeDetailsHTML(trades, date, dayStats) {
        const formattedDate = this.app.formatDate(date);
        const totalPnL = dayStats.total_pnl || 0;
        
        let html = `
            <div class="trade-details-header">
                <h4>Trades for ${formattedDate}</h4>
                <div class="trade-pnl ${totalPnL >= 0 ? 'positive' : 'negative'}">
                    Total P&L: ${this.app.formatCurrency(totalPnL)}
                </div>
            </div>
            <div class="trades-list">
        `;

        trades.forEach(trade => {
            html += this.generateTradeCardHTML(trade);
        });

        html += '</div>';
        return html;
    }

    /**
     * Generate HTML for individual trade card
     */
    generateTradeCardHTML(trade) {
        const pnl = trade.pnl || 0;
        const pnlClass = pnl >= 0 ? 'positive' : 'negative';
        
        return `
            <div class="position-card" data-trade-id="${trade.id}">
                <div class="position-header">
                    <div class="position-title">
                        <div class="company-name">${trade.company || 'Unknown'}</div>
                        <div class="position-date">${this.app.formatDate(trade.open_time)}</div>
                    </div>
                    <div class="position-actions">
                        <button class="action-btn add-note" title="Add Notes">
                            <i class="fas fa-sticky-note"></i>
                            Notes
                        </button>
                        <button class="action-btn add-image" title="Add Image">
                            <i class="fas fa-image"></i>
                            Image
                        </button>
                        <button class="action-btn add-strategy" title="Set Strategy">
                            <i class="fas fa-chess"></i>
                            Strategy
                        </button>
                    </div>
                </div>
                <div class="position-details">
                    <div class="detail-item">
                        <span class="detail-label">P&L:</span>
                        <span class="detail-value trade-pnl ${pnlClass}">${this.app.formatCurrency(pnl)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Quantity:</span>
                        <span class="detail-value">${trade.quantity || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Entry Price:</span>
                        <span class="detail-value">${trade.entry_price ? this.app.formatCurrency(trade.entry_price) : 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Exit Price:</span>
                        <span class="detail-value">${trade.exit_price ? this.app.formatCurrency(trade.exit_price) : 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="status-badge imported">Imported</span>
                        </span>
                    </div>
                </div>
                ${this.generateTradeNotesHTML(trade)}
                ${this.generateTradeImageHTML(trade)}
                ${this.generateTradeStrategyHTML(trade)}
            </div>
        `;
    }

    /**
     * Generate trade notes HTML
     */
    generateTradeNotesHTML(trade) {
        if (!trade.notes) return '';
        
        return `
            <div class="trade-notes-container">
                <h5>Trade Notes:</h5>
                <div class="trade-notes">${trade.notes}</div>
            </div>
        `;
    }

    /**
     * Generate trade image HTML
     */
    generateTradeImageHTML(trade) {
        if (!trade.image_path) return '';
        
        return `
            <div class="trade-image-container">
                <h5>Trade Image:</h5>
                <div class="trade-image-wrapper">
                    <img src="${trade.image_path}" alt="Trade Screenshot" class="trade-image" onclick="this.classList.toggle('enlarged')">
                    <button class="delete-image-btn" title="Delete Image">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate trade strategy HTML
     */
    generateTradeStrategyHTML(trade) {
        if (!trade.strategy && !trade.custom_strategy) return '';
        
        return `
            <div class="strategy-container">
                <h5>Strategy:</h5>
                <div class="strategy-info">
                    <div class="strategy-name">${trade.strategy || 'Custom'}</div>
                    ${trade.custom_strategy ? `<div class="custom-strategy">${trade.custom_strategy}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Show notes modal for a trade
     */
    showNotesModal(tradeId) {
        const modal = this.createModal('Trade Notes', 'notes-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        // Find existing notes
        let existingNotes = '';
        // This would need to be implemented to fetch existing notes
        
        modalBody.innerHTML = `
            <div class="notes-form">
                <label for="tradeNotes">Trade Notes:</label>
                <textarea id="tradeNotes" placeholder="Enter your trade notes here..." rows="8">${existingNotes}</textarea>
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
        `;

        // Add event listener for save button
        const saveBtn = modal.querySelector('.save-notes-btn');
        saveBtn.addEventListener('click', () => this.saveTradeNotes(tradeId, modal));

        this.showModal(modal);
    }

    /**
     * Save trade notes
     */
    async saveTradeNotes(tradeId, modal) {
        const notesTextarea = modal.querySelector('#tradeNotes');
        const notes = notesTextarea.value.trim();

        try {
            const result = await this.app.dataManager.updateTradeNotes(tradeId, notes);
            
            if (result) {
                this.app.showNotification('Trade notes saved successfully!', 'success');
                this.hideModal();
                await this.refreshCurrentModal();
            } else {
                this.app.showNotification('Failed to save notes', 'error');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            this.app.showNotification('Error saving notes', 'error');
        }
    }

    /**
     * Show image upload modal
     */
    showImageUpload(tradeId) {
        const modal = this.createModal('Upload Trade Image', 'image-upload-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="image-upload-form">
                <div class="upload-area-small" onclick="document.getElementById('tradeImageInput').click()">
                    <i class="fas fa-cloud-upload-alt upload-icon"></i>
                    <h4>Upload Trade Screenshot</h4>
                    <p>Click to select an image file</p>
                    <button type="button" class="upload-btn-small">
                        <i class="fas fa-folder-open"></i>
                        Choose File
                    </button>
                </div>
                <input type="file" id="tradeImageInput" accept="image/*" style="display: none;">
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
        `;

        // Add file input handler
        const fileInput = modal.querySelector('#tradeImageInput');
        const uploadBtn = modal.querySelector('.upload-image-btn');
        
        fileInput.addEventListener('change', (e) => {
            uploadBtn.disabled = !e.target.files[0];
        });

        uploadBtn.addEventListener('click', () => this.uploadTradeImage(tradeId, modal));

        this.showModal(modal);
    }

    /**
     * Upload trade image
     */
    async uploadTradeImage(tradeId, modal) {
        const fileInput = modal.querySelector('#tradeImageInput');
        const file = fileInput.files[0];

        if (!file) {
            this.app.showNotification('Please select an image file', 'error');
            return;
        }

        try {
            const result = await this.app.dataManager.uploadTradeImage(tradeId, file);
            
            if (result) {
                this.app.showNotification('Image uploaded successfully!', 'success');
                this.hideModal();
                await this.refreshCurrentModal();
            } else {
                this.app.showNotification('Failed to upload image', 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            this.app.showNotification('Error uploading image', 'error');
        }
    }

    /**
     * Show strategy selection modal
     */
    showStrategyModal(tradeId) {
        const modal = this.createModal('Trade Strategy', 'strategy-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="strategy-form">
                <label for="strategySelect">Select Strategy:</label>
                <select id="strategySelect" class="strategy-select">
                    <option value="">-- Select a Strategy --</option>
                    ${this.strategies.map(strategy => 
                        `<option value="${strategy}">${strategy}</option>`
                    ).join('')}
                </select>
                
                <div class="custom-strategy-container" id="customStrategyContainer" style="display: none;">
                    <label for="customStrategy">Custom Strategy:</label>
                    <input type="text" id="customStrategy" placeholder="Enter your custom strategy...">
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
        `;

        // Handle strategy selection
        const strategySelect = modal.querySelector('#strategySelect');
        const customContainer = modal.querySelector('#customStrategyContainer');
        
        strategySelect.addEventListener('change', (e) => {
            customContainer.style.display = e.target.value === 'OTHER' ? 'block' : 'none';
        });

        // Add save handler
        const saveBtn = modal.querySelector('.save-strategy-btn');
        saveBtn.addEventListener('click', () => this.saveTradeStrategy(tradeId, modal));

        this.showModal(modal);
    }

    /**
     * Save trade strategy
     */
    async saveTradeStrategy(tradeId, modal) {
        const strategySelect = modal.querySelector('#strategySelect');
        const customInput = modal.querySelector('#customStrategy');
        
        const strategy = strategySelect.value;
        const customStrategy = strategy === 'OTHER' ? customInput.value.trim() : '';

        if (!strategy) {
            this.app.showNotification('Please select a strategy', 'error');
            return;
        }

        if (strategy === 'OTHER' && !customStrategy) {
            this.app.showNotification('Please enter a custom strategy', 'error');
            return;
        }

        try {
            const result = await this.app.dataManager.updateTradeStrategy(tradeId, strategy, customStrategy);
            
            if (result) {
                this.app.showNotification('Strategy saved successfully!', 'success');
                this.hideModal();
                await this.refreshCurrentModal();
            } else {
                this.app.showNotification('Failed to save strategy', 'error');
            }
        } catch (error) {
            console.error('Error saving strategy:', error);
            this.app.showNotification('Error saving strategy', 'error');
        }
    }

    /**
     * Delete trade image
     */
    async deleteTradeImage(tradeId) {
        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }

        try {
            const result = await this.app.dataManager.deleteTradeImage(tradeId);
            
            if (result) {
                this.app.showNotification('Image deleted successfully!', 'success');
                await this.refreshCurrentModal();
            } else {
                this.app.showNotification('Failed to delete image', 'error');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            this.app.showNotification('Error deleting image', 'error');
        }
    }

    /**
     * Create a basic modal structure
     */
    createModal(title, className = '') {
        const modal = document.createElement('div');
        modal.className = `modal ${className} active`;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- Content will be inserted here -->
                </div>
            </div>
        `;

        // Add close functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => this.hideModal());

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        return modal;
    }

    /**
     * Show modal
     */
    showModal(modal) {
        if (this.currentModal) {
            this.hideModal();
        }

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        this.currentModal = modal;
        
        // Trigger animation
        setTimeout(() => modal.classList.add('active'), 10);
    }

    /**
     * Hide current modal
     */
    hideModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('active');
            setTimeout(() => {
                if (this.currentModal && this.currentModal.parentNode) {
                    this.currentModal.parentNode.removeChild(this.currentModal);
                }
                this.currentModal = null;
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    /**
     * Refresh current modal after updates
     */
    async refreshCurrentModal() {
        if (this.app.currentModalContext === 'trades') {
            await this.app.loadData();
            this.showTradeDetails(this.app.currentTradeDate, this.app.currentDayStats);
        }
    }
} 
/**
 * Trading Journal - Main Application Core
 * Coordinates all modules and handles application initialization
 */

class TradingJournal {
    constructor() {
        this.currentDate = new Date();
        this.dailyStats = [];
        this.statistics = {};
        this.currentModalContext = null;
        this.currentTradeDate = null;
        this.currentDayStats = null;
        
        // Initialize modules
        this.calendarManager = null;
        this.dataManager = null;
        this.modalManager = null;
        this.uploadManager = null;
        this.notificationManager = null;
        this.eventManager = null;
        
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize modules
            this.initializeModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Render initial calendar
            this.renderCalendar();
            
            console.log('Trading Journal initialized successfully');
        } catch (error) {
            console.error('Error initializing Trading Journal:', error);
            this.showNotification('Failed to initialize application', 'error');
        }
    }

    initializeModules() {
        // Initialize core modules
        console.log('TradingJournal: Initializing modules...');
        this.dataManager = new DataManager();
        this.notificationManager = new NotificationManager();
        this.calendarManager = new CalendarManager(this);
        this.modalManager = new ModalManager(this);
        this.uploadManager = new UploadManager(this);
        this.eventManager = new EventManager(this);
        console.log('TradingJournal: All modules initialized');
    }

    setupEventListeners() {
        // Delegate event setup to EventManager
        this.eventManager.init();
    }

    async loadData() {
        try {
            // Load statistics and daily stats through DataManager
            const [statistics, dailyStats] = await Promise.all([
                this.dataManager.getStatistics(),
                this.dataManager.getDailyStats()
            ]);
            
            this.statistics = statistics;
            this.dailyStats = dailyStats;
            
            this.updateStatistics();
            this.renderCalendar();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Failed to load data', 'error');
        }
    }

    updateStatistics() {
        const stats = this.statistics;
        
        // Update main statistics display
        const elements = {
            totalPnL: { value: stats.totalPnL || 0, format: 'currency' },
            winRate: { value: (stats.winRate || 0).toFixed(1) + '%', format: 'text' },
            totalTrades: { value: stats.totalTrades || 0, format: 'text' },
            winningTrades: { value: stats.winningTrades || 0, format: 'text' },
            losingTrades: { value: stats.losingTrades || 0, format: 'text' },
            averageWin: { value: stats.averageWin || 0, format: 'currency' },
            averageLoss: { value: stats.averageLoss || 0, format: 'currency' },
            bestTrade: { value: stats.bestTrade || 0, format: 'currency' },
            worstTrade: { value: stats.worstTrade || 0, format: 'currency' }
        };

        Object.entries(elements).forEach(([id, config]) => {
            const element = document.getElementById(id);
            if (element) {
                if (config.format === 'currency') {
                    element.textContent = this.formatCurrency(config.value);
                    element.className = `stat-value ${config.value >= 0 ? 'positive' : 'negative'}`;
                } else {
                    element.textContent = config.value;
                }
            }
        });
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        this.calendarManager.render(this.currentDate, this.dailyStats);
    }

    // Trade details functionality
    async showTradeDetails(date, dayStats) {
        this.currentModalContext = 'trades';
        this.currentTradeDate = date;
        this.currentDayStats = dayStats;
        
        await this.modalManager.showTradeDetails(date, dayStats);
    }

    // File upload functionality
    async handleFileUpload(file) {
        await this.uploadManager.handleFileUpload(file);
        // Reload data after successful upload
        await this.loadData();
    }

    // Notification functionality
    showNotification(message, type) {
        this.notificationManager.show(message, type);
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return date.toLocaleDateString('en-GB', options);
    }

    // Modal management delegation
    hidePositionsModal() {
        this.modalManager.hideModal();
    }

    // Database operations
    async clearDatabase() {
        try {
            const response = await this.dataManager.clearDatabase();
            this.showNotification(response.message || 'Database cleared', 'success');
            await this.loadData();
        } catch (error) {
            console.error('Error clearing database:', error);
            this.showNotification('Failed to clear database', 'error');
        }
    }

    // Application shutdown
    async quitApplication() {
        try {
            this.showNotification('Shutting down application...', 'success');
            await this.dataManager.shutdownApplication();
            window.close();
        } catch (error) {
            console.error('Error shutting down application:', error);
            this.showNotification('Failed to shutdown application', 'error');
        }
    }

    // Public API for modules to access app state
    getCurrentDate() {
        return this.currentDate;
    }

    getDailyStats() {
        return this.dailyStats;
    }

    getStatistics() {
        return this.statistics;
    }
} 
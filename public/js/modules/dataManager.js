/**
 * DataManager - Handles all API calls and data operations
 */

class DataManager {
    constructor() {
        this.baseUrl = '/api';
    }

    /**
     * Generic API request handler
     */
    async apiRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Get trading statistics
     */
    async getStatistics() {
        return await this.apiRequest('/statistics');
    }

    /**
     * Get daily statistics for calendar
     */
    async getDailyStats() {
        return await this.apiRequest('/daily-stats');
    }

    /**
     * Upload CSV file
     */
    async uploadCSV(file) {
        const formData = new FormData();
        formData.append('csvFile', file);

        try {
            const response = await fetch(`${this.baseUrl}/upload-csv`, {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error('CSV upload failed:', error);
            throw error;
        }
    }

    /**
     * Get trades for a specific date
     */
    async getTradesForDate(date) {
        const formattedDate = date.toISOString().split('T')[0];
        return await this.apiRequest(`/trades/${formattedDate}`);
    }

    /**
     * Update trade notes
     */
    async updateTradeNotes(tradeId, notes) {
        return await this.apiRequest(`/update-trade-notes/${tradeId}`, {
            method: 'PUT',
            body: JSON.stringify({ notes })
        });
    }

    /**
     * Upload trade image
     */
    async uploadTradeImage(tradeId, file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${this.baseUrl}/upload-trade-image/${tradeId}`, {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    /**
     * Delete trade image
     */
    async deleteTradeImage(tradeId) {
        return await this.apiRequest(`/delete-trade-image/${tradeId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Update trade strategy
     */
    async updateTradeStrategy(tradeId, strategy, customStrategy = '') {
        return await this.apiRequest(`/update-trade-strategy/${tradeId}`, {
            method: 'PUT',
            body: JSON.stringify({ strategy, customStrategy })
        });
    }

    /**
     * Clear entire database
     */
    async clearDatabase() {
        return await this.apiRequest('/clear-database', {
            method: 'DELETE'
        });
    }

    /**
     * Shutdown application
     */
    async shutdownApplication() {
        return await this.apiRequest('/shutdown', {
            method: 'POST'
        });
    }

    /**
     * Validate CSV file before upload
     */
    validateCSVFile(file) {
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return { isValid: false, errors };
        }

        // Check file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            errors.push('File must be a CSV file');
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            errors.push('File size must be less than 10MB');
        }

        // Check if file is empty
        if (file.size === 0) {
            errors.push('File cannot be empty');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get upload progress for file operations
     */
    createProgressTracker() {
        return {
            total: 0,
            loaded: 0,
            percentage: 0,
            startTime: Date.now(),
            
            update(loaded, total) {
                this.loaded = loaded;
                this.total = total;
                this.percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
            },
            
            getElapsedTime() {
                return Date.now() - this.startTime;
            },
            
            getEstimatedTimeRemaining() {
                const elapsed = this.getElapsedTime();
                const rate = this.loaded / elapsed;
                const remaining = this.total - this.loaded;
                return remaining / rate;
            }
        };
    }
} 
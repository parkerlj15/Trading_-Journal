/**
 * UploadManager - Handles file upload functionality
 */

class UploadManager {
    constructor(app) {
        this.app = app;
        this.isUploading = false;
        this.progressElements = {
            container: null,
            bar: null,
            fill: null,
            text: null,
            results: null
        };
    }

    /**
     * Handle CSV file upload
     */
    async handleFileUpload(file) {
        console.log('UploadManager: handleFileUpload called with file:', file ? file.name : 'null');
        
        if (this.isUploading) {
            this.app.showNotification('Upload already in progress', 'error');
            return;
        }

        // Validate file
        const validation = this.app.dataManager.validateCSVFile(file);
        if (!validation.isValid) {
            this.app.showNotification(validation.errors.join(', '), 'error');
            return;
        }

        this.isUploading = true;
        this.showUploadProgress();

        try {
            // Show initial progress
            this.updateProgress(0, `Preparing upload...`);

            // Upload file
            const result = await this.uploadWithProgress(file);
            console.log('Upload result:', result);

            // Check if upload was successful (like original implementation)
            if (result.message && !result.error) {
                this.showUploadResult(
                    result.message || 'File uploaded successfully!',
                    'success',
                    this.formatUploadStats(result)
                );
                
                // Reload app data after successful upload
                await this.app.loadData();
                
            } else {
                this.showUploadResult(
                    result.error || 'Upload failed',
                    'error'
                );
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showUploadResult(
                'Upload failed: ' + error.message,
                'error'
            );
        } finally {
            this.isUploading = false;
            this.hideUploadProgressAfterDelay();
        }
    }

    /**
     * Upload file with progress tracking
     */
    async uploadWithProgress(file) {
        console.log('UploadManager: Starting upload with fetch');
        
        const formData = new FormData();
        formData.append('csvFile', file);

        // Start simulated progress
        this.startSimulatedProgress();

        try {
            const response = await fetch('/api/upload-csv', {
                method: 'POST',
                body: formData
            });

            console.log(`Fetch response received. Status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Upload result:', result);
            
            // Complete progress
            this.updateProgress(100, 'Upload complete!');
            
            return result;
            
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        } finally {
            this.stopSimulatedProgress();
        }
    }

    /**
     * Start simulated progress (like original implementation)
     */
    startSimulatedProgress() {
        let progress = 0;
        this.progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            let message;
            if (progress < 30) {
                message = 'Uploading file...';
            } else if (progress < 60) {
                message = 'Cleaning data...';
            } else {
                message = 'Processing trades...';
            }
            
            this.updateProgress(progress, message);
        }, 200);
    }

    /**
     * Stop simulated progress
     */
    stopSimulatedProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    /**
     * Show upload progress UI
     */
    showUploadProgress() {
        this.getProgressElements();
        
        if (this.progressElements.container) {
            this.progressElements.container.style.display = 'block';
            this.updateProgress(0, 'Initializing upload...');
            
            // Hide upload results
            if (this.progressElements.results) {
                this.progressElements.results.style.display = 'none';
            }
        } else {
            console.warn('Upload progress elements not found in DOM');
        }
    }

    /**
     * Update progress display
     */
    updateProgress(percentage, message) {
        this.getProgressElements();

        if (this.progressElements.fill) {
            this.progressElements.fill.style.width = `${percentage}%`;
        }

        if (this.progressElements.text) {
            this.progressElements.text.textContent = message;
        }
    }

    /**
     * Hide upload progress UI
     */
    hideUploadProgress() {
        this.stopSimulatedProgress();
        
        if (this.progressElements.container) {
            this.progressElements.container.style.display = 'none';
        }
        
        if (this.progressElements.fill) {
            this.progressElements.fill.style.width = '100%';
        }
    }

    /**
     * Hide upload progress after delay
     */
    hideUploadProgressAfterDelay(delay = 3000) {
        setTimeout(() => {
            this.hideUploadProgress();
        }, delay);
    }

    /**
     * Show upload results
     */
    showUploadResult(message, type, stats = '') {
        this.getProgressElements();

        if (this.progressElements.results) {
            const resultMessage = this.progressElements.results.querySelector('#resultMessage');
            const resultStats = this.progressElements.results.querySelector('#resultStats');

            if (resultMessage) {
                resultMessage.textContent = message;
                resultMessage.className = `result-message ${type}`;
            }

            if (resultStats && stats) {
                resultStats.textContent = stats;
            }

            this.progressElements.results.className = `upload-results ${type}`;
            this.progressElements.results.style.display = 'block';
        }

        // Also show notification
        this.app.showNotification(message, type);
    }

    /**
     * Hide upload results
     */
    hideUploadResults() {
        if (this.progressElements.results) {
            this.progressElements.results.style.display = 'none';
        }
    }

    /**
     * Get progress elements from DOM
     */
    getProgressElements() {
        if (!this.progressElements.container) {
            this.progressElements.container = document.getElementById('uploadProgress');
            this.progressElements.bar = document.querySelector('.progress-bar');
            this.progressElements.fill = document.getElementById('progressFill');
            this.progressElements.text = document.getElementById('progressText');
            this.progressElements.results = document.getElementById('uploadResults');
            
            // Debug logging
            if (!this.progressElements.container) {
                console.error('Upload progress container not found');
            }
            if (!this.progressElements.fill) {
                console.error('Progress fill element not found');
            }
            if (!this.progressElements.text) {
                console.error('Progress text element not found');
            }
            if (!this.progressElements.results) {
                console.error('Upload results element not found');
            }
        }
    }

    /**
     * Format upload statistics for display
     */
    formatUploadStats(result) {
        if (!result) return '';

        const parts = [];

        if (result.totalProcessed) {
            parts.push(`${result.totalProcessed} records processed`);
        }

        if (result.newTrades) {
            parts.push(`${result.newTrades} trades imported`);
        }

        if (result.skippedClosedTrades) {
            parts.push(`${result.skippedClosedTrades} records skipped`);
        }

        if (result.errors && result.errors > 0) {
            parts.push(`${result.errors} errors encountered`);
        }

        return parts.join(', ');
    }

    /**
     * Validate file before upload
     */
    validateFileBeforeUpload(file) {
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return { isValid: false, errors };
        }

        // Check file extension
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.csv')) {
            errors.push('Please select a CSV file');
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            errors.push(`File size (${this.formatFileSize(file.size)}) exceeds 10MB limit`);
        }

        // Check if file is empty
        if (file.size === 0) {
            errors.push('File appears to be empty');
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
     * Get file information
     */
    getFileInfo(file) {
        if (!file) return null;

        return {
            name: file.name,
            size: file.size,
            sizeFormatted: this.formatFileSize(file.size),
            type: file.type,
            lastModified: new Date(file.lastModified),
            extension: file.name.split('.').pop().toLowerCase()
        };
    }

    /**
     * Preview CSV file contents (first few lines)
     */
    async previewCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n').slice(0, 5); // First 5 lines
                    
                    resolve({
                        preview: lines,
                        totalLines: text.split('\n').length,
                        hasHeaders: lines.length > 0
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            
            // Read only first 1KB for preview
            const blob = file.slice(0, 1024);
            reader.readAsText(blob);
        });
    }

    /**
     * Cancel current upload
     */
    cancelUpload() {
        if (this.currentXHR) {
            this.currentXHR.abort();
            this.currentXHR = null;
        }
        
        this.isUploading = false;
        this.hideUploadProgress();
        this.app.showNotification('Upload cancelled', 'error');
    }

    /**
     * Check if upload is in progress
     */
    isUploadInProgress() {
        return this.isUploading;
    }

    /**
     * Reset upload state
     */
    reset() {
        this.isUploading = false;
        this.currentXHR = null;
        this.hideUploadProgress();
        this.hideUploadResults();
    }
} 
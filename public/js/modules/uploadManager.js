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

            if (result.success) {
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
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('csvFile', file);

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentage = Math.round((e.loaded / e.total) * 100);
                    this.updateProgress(percentage, `Uploading... ${percentage}%`);
                }
            });

            // Handle response
            xhr.addEventListener('load', () => {
                try {
                    const result = JSON.parse(xhr.responseText);
                    resolve(result);
                } catch (error) {
                    reject(new Error('Invalid response format'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload cancelled'));
            });

            // Start upload
            xhr.open('POST', '/api/upload-csv');
            xhr.send(formData);
        });
    }

    /**
     * Show upload progress UI
     */
    showUploadProgress() {
        this.getProgressElements();
        
        if (this.progressElements.container) {
            this.progressElements.container.style.display = 'block';
            this.updateProgress(0, 'Initializing upload...');
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
        if (this.progressElements.container) {
            this.progressElements.container.style.display = 'none';
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
        }
    }

    /**
     * Format upload statistics for display
     */
    formatUploadStats(result) {
        if (!result.stats) return '';

        const stats = result.stats;
        const parts = [];

        if (stats.processed) {
            parts.push(`${stats.processed} records processed`);
        }

        if (stats.inserted) {
            parts.push(`${stats.inserted} trades imported`);
        }

        if (stats.updated) {
            parts.push(`${stats.updated} trades updated`);
        }

        if (stats.skipped) {
            parts.push(`${stats.skipped} records skipped`);
        }

        if (stats.errors && stats.errors > 0) {
            parts.push(`${stats.errors} errors encountered`);
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
/**
 * EventManager - Handles all event listeners and user interactions
 */

class EventManager {
    constructor(app) {
        this.app = app;
        this.eventListeners = new Map();
    }

    /**
     * Initialize all event listeners
     */
    init() {
        this.setupCalendarEvents();
        this.setupUploadEvents();
        this.setupModalEvents();
        this.setupHeaderButtonEvents();
        this.setupKeyboardEvents();
        this.setupWindowEvents();
    }

    /**
     * Setup calendar navigation events
     */
    setupCalendarEvents() {
        this.addEventListener('prevMonth', 'click', () => {
            this.app.navigateMonth(-1);
        });

        this.addEventListener('nextMonth', 'click', () => {
            this.app.navigateMonth(1);
        });

        // Add double-click to go to today
        this.addEventListener('currentMonth', 'dblclick', () => {
            this.app.calendarManager.navigateToToday();
        });
    }

    /**
     * Setup file upload events
     */
    setupUploadEvents() {
        const fileInput = document.getElementById('csvFileInput');
        const browseBtn = document.getElementById('browseBtn');

        if (browseBtn && fileInput) {
            console.log('EventManager: Setting up file upload events');
            
            this.addEventListener(browseBtn, 'click', () => {
                console.log('EventManager: Browse button clicked');
                fileInput.click();
            });

            this.addEventListener(fileInput, 'change', (e) => {
                console.log('EventManager: File input changed');
                const file = e.target.files[0];
                if (file) {
                    console.log('EventManager: File selected:', file.name);
                    this.app.handleFileUpload(file);
                } else {
                    console.log('EventManager: No file selected');
                }
            });
        } else {
            console.error('EventManager: Upload elements not found', { browseBtn, fileInput });
        }

        // Add drag and drop functionality
        this.setupDragAndDrop();
    }

    /**
     * Setup drag and drop for file upload
     */
    setupDragAndDrop() {
        const uploadArea = document.querySelector('.upload-area');
        if (!uploadArea) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.addEventListener(uploadArea, eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight drop area
        ['dragenter', 'dragover'].forEach(eventName => {
            this.addEventListener(uploadArea, eventName, () => {
                uploadArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.addEventListener(uploadArea, eventName, () => {
                uploadArea.classList.remove('drag-over');
            });
        });

        // Handle dropped files
        this.addEventListener(uploadArea, 'drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.app.handleFileUpload(files[0]);
            }
        });
    }

    /**
     * Setup modal events
     */
    setupModalEvents() {
        // Close modal when clicking outside
        this.addEventListener(document, 'click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.app.hidePositionsModal();
            }
        });

        // Event delegation for all modal buttons (works with dynamically created modals)
        this.addEventListener(document, 'click', (e) => {
            // Check if the click is inside a modal
            const modal = e.target.closest('.modal');
            if (!modal) return;

            this.handleModalButtonClick(e);
        });
    }

    /**
     * Handle modal button clicks
     */
    handleModalButtonClick(e) {
        // Find the button that was clicked
        const button = e.target.closest('button') || e.target.closest('.action-btn');
        if (!button) return;

        // Check if it's a modal action button
        const tradeId = button.dataset.tradeId || e.target.closest('[data-trade-id]')?.dataset.tradeId;

        // Handle trade action buttons
        if (tradeId && (
            button.classList.contains('add-note') ||
            button.classList.contains('add-image') ||
            button.classList.contains('add-strategy')
        )) {
            e.preventDefault();
            e.stopPropagation();

            if (button.classList.contains('add-note')) {
                this.app.modalManager.showNotesModal(parseInt(tradeId));
            } else if (button.classList.contains('add-image')) {
                this.app.modalManager.showImageUpload(parseInt(tradeId));
            } else if (button.classList.contains('add-strategy')) {
                this.app.modalManager.showStrategyModal(parseInt(tradeId));
            }
            return;
        }

        // Handle other modal buttons (save, cancel, delete, etc.)
        if (button.classList.contains('delete-image-btn')) {
            const deleteTradeId = button.closest('[data-trade-id]')?.dataset.tradeId;
            if (deleteTradeId) {
                e.preventDefault();
                e.stopPropagation();
                this.app.modalManager.deleteTradeImage(parseInt(deleteTradeId));
            }
        }
    }

    /**
     * Setup header button events
     */
    setupHeaderButtonEvents() {
        // Clear database button
        this.addEventListener('clearDbBtn', 'click', async () => {
            if (confirm('Are you sure you want to clear the database? This action cannot be undone.')) {
                await this.app.clearDatabase();
            }
        });

        // Quit application button
        this.addEventListener('quitAppBtn', 'click', async () => {
            if (confirm('Are you sure you want to quit the application?')) {
                await this.app.quitApplication();
            }
        });
    }

    /**
     * Setup keyboard events
     */
    setupKeyboardEvents() {
        this.addEventListener(document, 'keydown', (e) => {
            // ESC key to close modals
            if (e.key === 'Escape') {
                this.app.hidePositionsModal();
            }

            // Arrow keys for calendar navigation
            if (e.key === 'ArrowLeft' && e.ctrlKey) {
                e.preventDefault();
                this.app.navigateMonth(-1);
            } else if (e.key === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                this.app.navigateMonth(1);
            }

            // Ctrl+Home to go to today
            if (e.key === 'Home' && e.ctrlKey) {
                e.preventDefault();
                this.app.calendarManager.navigateToToday();
            }
        });
    }

    /**
     * Setup window events
     */
    setupWindowEvents() {
        // Handle window resize
        this.addEventListener(window, 'resize', this.debounce(() => {
            this.handleWindowResize();
        }, 250));

        // Handle visibility change
        this.addEventListener(document, 'visibilitychange', () => {
            if (!document.hidden) {
                // Refresh data when tab becomes visible
                this.app.loadData();
            }
        });

        // Handle before unload
        this.addEventListener(window, 'beforeunload', (e) => {
            if (this.app.uploadManager && this.app.uploadManager.isUploadInProgress()) {
                e.preventDefault();
                e.returnValue = 'Upload in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Refresh calendar layout if needed
        if (this.app.calendarManager) {
            this.app.renderCalendar();
        }

        // Adjust modal sizes if needed
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            this.adjustModalSize(activeModal);
        }
    }

    /**
     * Adjust modal size for different screen sizes
     */
    adjustModalSize(modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;

        const windowHeight = window.innerHeight;
        const maxHeight = windowHeight * 0.9;
        
        modalContent.style.maxHeight = `${maxHeight}px`;
    }

    /**
     * Add event listener with tracking
     */
    addEventListener(elementOrId, event, handler) {
        let element;
        
        if (typeof elementOrId === 'string') {
            element = document.getElementById(elementOrId);
            if (!element) {
                console.warn(`Element with ID '${elementOrId}' not found`);
                return;
            }
        } else {
            element = elementOrId;
        }

        if (!element) return;

        // Create wrapped handler for cleanup
        const wrappedHandler = (e) => {
            try {
                handler(e);
            } catch (error) {
                console.error('Event handler error:', error);
                this.app.showNotification('An error occurred', 'error');
            }
        };

        element.addEventListener(event, wrappedHandler);

        // Track for cleanup
        const key = `${element.tagName}_${event}_${Date.now()}`;
        this.eventListeners.set(key, {
            element,
            event,
            handler: wrappedHandler
        });
    }

    /**
     * Remove all event listeners
     */
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }

    /**
     * Debounce function for performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function for performance
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Add click animation to buttons
     */
    setupButtonAnimations() {
        this.addEventListener(document, 'click', (e) => {
            const button = e.target.closest('button');
            if (button && !button.classList.contains('loading')) {
                button.classList.add('clicked');
                setTimeout(() => {
                    button.classList.remove('clicked');
                }, 150);
            }
        });
    }

    /**
     * Setup intersection observer for animations
     */
    setupIntersectionObserver() {
        if (!window.IntersectionObserver) return;

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

        // Observe major sections
        const sections = document.querySelectorAll('.calendar-section, .stats-section, .upload-section');
        sections.forEach(section => observer.observe(section));
    }
} 
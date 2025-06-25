/**
 * Trading Journal - Main Application Entry Point
 * Coordinates all modules and handles application initialization
 */

// Global variables for backward compatibility
let tradingJournal;
let notificationManager;

/**
 * Initialize the application
 */
function initializeApp() {
    try {
        // Create global notification manager for utility functions
        notificationManager = new NotificationManager();
        
        // Initialize the main application
        tradingJournal = new TradingJournal();
        
        // Make globally accessible for onclick handlers
        window.tradingJournal = tradingJournal;
        window.notificationManager = notificationManager;
        
        console.log('Trading Journal initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Trading Journal:', error);
        
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to initialize application. Please refresh the page.</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }
}

/**
 * Enhanced UX features
 */
function initializeEnhancements() {
    // Add smooth scrolling
    if (document.documentElement) {
        document.documentElement.style.scrollBehavior = 'smooth';
    }
    
    // Add loading animation to buttons
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (button && !button.classList.contains('loading')) {
            button.classList.add('loading');
            setTimeout(() => {
                button.classList.remove('loading');
            }, 1000);
        }
    });
    
    // Add fade-in animation to elements as they come into view
    if (window.IntersectionObserver) {
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
    }
}

/**
 * Error handling and logging
 */
function setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        if (window.tradingJournal && window.tradingJournal.showNotification) {
            window.tradingJournal.showNotification('An unexpected error occurred', 'error');
        }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        if (window.tradingJournal && window.tradingJournal.showNotification) {
            window.tradingJournal.showNotification('An unexpected error occurred', 'error');
        }
    });
}

/**
 * Performance monitoring
 */
function setupPerformanceMonitoring() {
    if (performance && performance.mark) {
        performance.mark('app-start');
        
        window.addEventListener('load', () => {
            performance.mark('app-loaded');
            
            try {
                performance.measure('app-load-time', 'app-start', 'app-loaded');
                const measure = performance.getEntriesByName('app-load-time')[0];
                console.log(`App loaded in ${measure.duration.toFixed(2)}ms`);
            } catch (e) {
                console.log('Performance measurement not available');
            }
        });
    }
}

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupErrorHandling();
        setupPerformanceMonitoring();
        initializeApp();
        initializeEnhancements();
    });
} else {
    // DOM is already ready
    setupErrorHandling();
    setupPerformanceMonitoring();
    initializeApp();
    initializeEnhancements();
} 
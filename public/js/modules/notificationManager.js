/**
 * NotificationManager - Handles toast notifications
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 3000; // 3 seconds
        this.container = null;
    }

    /**
     * Show a notification
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        const notification = this.createNotification(message, type, duration);
        this.displayNotification(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.remove(notification.id);
        }, duration);

        return notification.id;
    }

    /**
     * Create notification object
     */
    createNotification(message, type, duration) {
        const id = this.generateId();
        const notification = {
            id,
            message,
            type,
            duration,
            timestamp: Date.now(),
            element: null
        };

        this.notifications.push(notification);
        
        // Remove oldest if we exceed max
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.remove(oldest.id, false);
        }

        return notification;
    }

    /**
     * Display notification in DOM
     */
    displayNotification(notification) {
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.dataset.notificationId = notification.id;
        
        element.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(notification.type)}"></i>
                <span class="notification-message">${this.escapeHtml(notification.message)}</span>
                <button class="notification-close" onclick="notificationManager.remove('${notification.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        notification.element = element;

        // Add to DOM
        this.getContainer().appendChild(element);

        // Trigger show animation
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
    }

    /**
     * Remove notification
     */
    remove(id, animate = true) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const notification = this.notifications[index];
        
        if (notification.element) {
            if (animate) {
                notification.element.classList.remove('show');
                setTimeout(() => {
                    if (notification.element && notification.element.parentNode) {
                        notification.element.parentNode.removeChild(notification.element);
                    }
                }, 300);
            } else {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
            }
        }

        this.notifications.splice(index, 1);
    }

    /**
     * Remove all notifications
     */
    removeAll() {
        this.notifications.forEach(notification => {
            this.remove(notification.id, false);
        });
        this.notifications = [];
    }

    /**
     * Get notification container
     */
    getContainer() {
        if (!this.container) {
            this.container = document.getElementById('notificationContainer');
            
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'notificationContainer';
                this.container.className = 'notification-container';
                document.body.appendChild(this.container);
            }
        }
        
        return this.container;
    }

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        return icons[type] || icons.info;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Show success notification
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show error notification
     */
    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show warning notification
     */
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Show info notification
     */
    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    /**
     * Get all active notifications
     */
    getNotifications() {
        return [...this.notifications];
    }

    /**
     * Check if notifications are supported
     */
    isSupported() {
        return typeof document !== 'undefined';
    }

    /**
     * Set max notifications
     */
    setMaxNotifications(max) {
        this.maxNotifications = max;
    }

    /**
     * Set default duration
     */
    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }
} 
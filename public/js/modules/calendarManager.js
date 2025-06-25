/**
 * CalendarManager - Handles calendar rendering and interactions
 */

class CalendarManager {
    constructor(app) {
        this.app = app;
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }

    /**
     * Render the calendar for the given date
     */
    render(currentDate, dailyStats) {
        this.updateMonthDisplay(currentDate);
        this.renderCalendarGrid(currentDate, dailyStats);
    }

    /**
     * Update the month display in the header
     */
    updateMonthDisplay(currentDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthDisplay = document.getElementById('currentMonth');
        
        if (monthDisplay) {
            monthDisplay.textContent = `${this.monthNames[month]} ${year}`;
        }
    }

    /**
     * Render the calendar grid
     */
    renderCalendarGrid(currentDate, dailyStats) {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        // Clear existing content
        calendarGrid.innerHTML = '';

        // Add day headers
        this.addDayHeaders(calendarGrid);

        // Calculate calendar dates
        const { year, month, firstDay, daysInMonth, startingDayOfWeek } = this.getCalendarData(currentDate);

        // Add empty cells for days before month starts
        this.addEmptyDays(calendarGrid, startingDayOfWeek);

        // Add days of the month
        this.addMonthDays(calendarGrid, year, month, daysInMonth, dailyStats);
    }

    /**
     * Add day headers to calendar
     */
    addDayHeaders(calendarGrid) {
        this.dayHeaders.forEach(day => {
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
    }

    /**
     * Get calendar calculation data
     */
    getCalendarData(currentDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { year, month, firstDay, lastDay, daysInMonth, startingDayOfWeek };
    }

    /**
     * Add empty cells for days before month starts
     */
    addEmptyDays(calendarGrid, startingDayOfWeek) {
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(emptyDay);
        }
    }

    /**
     * Add the actual days of the month
     */
    addMonthDays(calendarGrid, year, month, daysInMonth, dailyStats) {
        const today = new Date();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(day, year, month, today, dailyStats);
            calendarGrid.appendChild(dayElement);
        }
    }

    /**
     * Create individual day element
     */
    createDayElement(day, year, month, today, dailyStats) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Create day number element
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Check if this is today
        const isToday = this.isToday(day, month, year, today);
        if (isToday) {
            dayElement.classList.add('today');
        }

        // Find stats for this day
        const dayStats = this.findDayStats(day, month, year, dailyStats);
        
        if (dayStats) {
            this.addDayStats(dayElement, dayStats);
            this.addDayClickHandler(dayElement, day, month, year, dayStats);
        }

        return dayElement;
    }

    /**
     * Check if a day is today
     */
    isToday(day, month, year, today) {
        return day === today.getDate() && 
               month === today.getMonth() && 
               year === today.getFullYear();
    }

    /**
     * Find statistics for a specific day
     */
    findDayStats(day, month, year, dailyStats) {
        // Create date string directly without timezone issues
        const targetDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dailyStats.find(stat => {
            // Direct string comparison - no timezone conversion
            return stat.date === targetDate;
        });
    }

    /**
     * Add statistics display to day element
     */
    addDayStats(dayElement, dayStats) {
        const pnl = dayStats.daily_pnl || dayStats.total_pnl || 0;
        
        // Add P&L display
        const dayPnl = document.createElement('div');
        dayPnl.className = 'day-pnl';
        dayPnl.textContent = this.app.formatCurrency(pnl);
        dayElement.appendChild(dayPnl);

        // Apply appropriate styling based on P&L
        if (pnl > 0) {
            dayElement.classList.add('profitable');
        } else if (pnl < 0) {
            dayElement.classList.add('loss');
        }

        // Add trade count if available
        if (dayStats.trade_count) {
            dayElement.title = `${dayStats.trade_count} trade${dayStats.trade_count > 1 ? 's' : ''} - ${this.app.formatCurrency(pnl)}`;
        }
    }

    /**
     * Add click handler for days with trades
     */
    addDayClickHandler(dayElement, day, month, year, dayStats) {
        dayElement.style.cursor = 'pointer';
        dayElement.addEventListener('click', () => {
            const clickedDate = new Date(year, month, day);
            this.app.showTradeDetails(clickedDate, dayStats);
        });

        // Add hover effect
        dayElement.addEventListener('mouseenter', () => {
            dayElement.style.transform = 'translateY(-2px) scale(1.02)';
        });

        dayElement.addEventListener('mouseleave', () => {
            dayElement.style.transform = '';
        });
    }

    /**
     * Get formatted date string for API calls
     */
    getFormattedDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Navigate to a specific month/year
     */
    navigateToMonth(year, month) {
        const newDate = new Date(year, month, 1);
        this.app.currentDate = newDate;
        this.render(newDate, this.app.getDailyStats());
    }

    /**
     * Navigate to today
     */
    navigateToToday() {
        const today = new Date();
        this.navigateToMonth(today.getFullYear(), today.getMonth());
    }

    /**
     * Get calendar statistics for the current month
     */
    getMonthStats(currentDate, dailyStats) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Format target month as YYYY-MM
        const targetMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        const monthStats = dailyStats.filter(stat => {
            // Extract year-month from date string (YYYY-MM-DD)
            const statMonth = stat.date.substring(0, 7); // Gets YYYY-MM
            return statMonth === targetMonth;
        });

        return {
            totalTrades: monthStats.reduce((sum, stat) => sum + (stat.trade_count || 0), 0),
            totalPnL: monthStats.reduce((sum, stat) => sum + (stat.daily_pnl || stat.total_pnl || 0), 0),
            profitableDays: monthStats.filter(stat => (stat.daily_pnl || stat.total_pnl || 0) > 0).length,
            lossDays: monthStats.filter(stat => (stat.daily_pnl || stat.total_pnl || 0) < 0).length,
            totalDaysTraded: monthStats.length
        };
    }

    /**
     * Highlight specific date
     */
    highlightDate(date) {
        const dateStr = this.getFormattedDate(date);
        const dayElements = document.querySelectorAll('.calendar-day');
        
        dayElements.forEach(element => {
            element.classList.remove('highlighted');
            // Add highlighting logic if needed
        });
    }
} 
# CSS Modular Structure

This directory contains the modular CSS files for the Trading Journal application. The original `styles.css` file (1875 lines) has been split into logical, manageable modules following best practices.

## File Structure

```
css/
├── main.css           # Main import file (imports all modules)
├── base.css           # Reset styles, variables, body, fundamentals (~100 lines)
├── navigation.css     # Navigation tabs and header buttons (~250 lines)
├── calendar.css       # Calendar section and related components (~260 lines)
├── statistics.css     # Statistics section and stat items (~140 lines)
├── upload.css         # Upload functionality and UI (~240 lines)
├── positions.css      # Position cards and trade details (~270 lines)
├── modals.css         # All modal styles and forms (~320 lines)
├── notifications.css  # Toast notifications (~50 lines)
├── responsive.css     # Media queries and responsive design (~140 lines)
└── README.md          # This documentation file
```

## Module Descriptions

### base.css
- CSS reset and base styles
- CSS custom properties (variables)
- Body and app container styles
- Global animations and scrollbar styling

### navigation.css
- Navigation tabs styling
- Header buttons (upload, clear database, quit)
- Tab states and interactions

### calendar.css
- Calendar section layout
- Calendar grid and day cells
- Calendar navigation buttons
- Legend styling

### statistics.css
- Statistics section panel
- Individual stat items
- View positions button

### upload.css
- Upload section and area
- Progress indicators
- Upload results and feedback
- File format information

### positions.css
- Position/trade cards
- Trade details and metadata
- Action buttons for notes, images, strategies
- Image display and management
- Notes and strategy displays

### modals.css
- Base modal structure
- Notes modal and form
- Image upload modal
- Strategy selection modal
- Form controls and actions

### notifications.css
- Toast notification system
- Success and error states

### responsive.css
- Media queries for different screen sizes
- Mobile-specific adaptations
- Responsive layout adjustments

## Usage

The main.css file imports all modules in the correct order to ensure proper cascading and dependencies. The HTML file only needs to link to `css/main.css`.

## Benefits of This Structure

1. **Maintainability**: Each file focuses on a specific functionality area
2. **Scalability**: Easy to add new features in separate files
3. **Performance**: Smaller individual files are easier to cache and load
4. **Collaboration**: Different developers can work on different modules
5. **Debugging**: Easier to locate and fix style issues
6. **Best Practices**: Follows CSS architecture guidelines

## Line Count Compliance

All individual CSS files are under 500 lines as requested:
- Largest file: modals.css (~320 lines)
- Smallest file: notifications.css (~50 lines)
- Total combined: ~1870 lines (equivalent to original file)

The modular structure maintains all original functionality while improving code organization and maintainability. 
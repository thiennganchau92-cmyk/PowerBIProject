# Filter Panel Visual for Power BI

A comprehensive, multi-filter custom visual for Power BI that provides Category, Numeric Range, Date, and Top N filtering in a unified, user-friendly interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Power BI](https://img.shields.io/badge/Power%20BI-Custom%20Visual-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)

---

## 📋 Features

### Four Filter Types

- **🏷️ Category Filter** - Multi-select checkboxes with search functionality
- **🔢 Numeric Range Filter** - Min/Max range filtering for numeric measures
- **📅 Date Filter** - Relative date filtering (Last 7 Days, Last 30 Days, etc.)
- **🏆 Top N Filter** - Show Top/Bottom N items ranked by measure

### Key Capabilities

✅ **Multiple Fields** - Support multiple category, numeric, and date fields simultaneously  
✅ **Active Filter Chips** - Visual display of all active filters with quick removal  
✅ **Flexible Scope** - Apply filters at Visual, Page, or Report level  
✅ **Apply Modes** - Instant or Commit mode for filter application  
✅ **OUCRU Theming** - Professional styling with customizable colors  
✅ **Search & Bulk Actions** - Quick value finding and bulk selection tools  
✅ **Responsive Design** - Clean, scrollable interface that adapts to visual size

---

## 🚀 Quick Start

### Installation

1. Import the `.pbiviz` file into Power BI Desktop
2. Add the visual to your report canvas
3. Drag fields into the appropriate data wells

### Basic Usage

```
1. Add fields to data wells:
   - Category Fields: Product, Region, Status, etc.
   - Date Fields: Order Date, Ship Date, etc.
   - Numeric Fields: Price, Quantity, Revenue, etc.
   - Top N Measure: Sales Amount, Count, etc.

2. Configure settings in Format pane:
   - Filter Scope: Page (recommended)
   - Apply Mode: Instant (default)
   - Show Active Filters: On

3. Use the filters:
   - Category: Check/uncheck values
   - Numeric: Enter min/max values
   - Date: Select relative time period
   - Top N: Choose category, measure, count, direction
```

---

## 📚 Documentation

### For End Users

📖 **[USER_GUIDE.md](USER_GUIDE.md)** - Complete usage guide  
- Getting started instructions
- Detailed behavior for each filter type
- Step-by-step workflows
- Troubleshooting tips
- Best practices and examples

📋 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference card  
- Filter types at a glance
- Settings overview
- Common workflows
- Quick troubleshooting

### For Developers

🔧 **[TECHNICAL_BEHAVIOR.md](TECHNICAL_BEHAVIOR.md)** - Technical documentation  
- Architecture overview
- Internal logic for each filter type
- Data flow diagrams
- State management
- API integration details
- Performance considerations
- Debugging guide

📝 **[FilterPaneltrackPlan.md](../FilterPaneltrackPlan.md)** - Development tracking  
- Implementation timeline
- Change log
- Issue resolutions

---

## 🎯 Use Cases

### Retail & E-Commerce
- Filter products by category, price range, and brand
- Show top 10 selling products
- View recent orders (last 30 days)

### Sales Analytics
- Filter by region, sales rep, and deal status
- Show top performers by revenue
- View sales from current quarter

### Operations
- Filter shipments by status and carrier
- Show orders in specific date ranges
- View bottom performers for improvement

### Finance
- Filter transactions by type and amount range
- Show top expense categories
- View year-to-date transactions

---

## ⚙️ Configuration

### Data Wells

| Well | Type | Purpose |
|------|------|---------|
| **Category Fields** | Grouping | Text/categorical filtering |
| **Date Fields** | Grouping | Date/datetime filtering |
| **Numeric Fields** | Measure | Numeric range filtering |
| **Top N Measure** | Measure | Ranking measure for Top N |

### Panel Settings

| Setting | Options | Description |
|---------|---------|-------------|
| **Filter Scope** | Visual, Page, Report | Where filters apply |
| **Apply Mode** | Instant, Commit | When filters activate |
| **Show Active Filters** | On/Off | Display filter chips |
| **Show Reset Button** | On/Off | Show reset all button |
| **Dense Mode** | On/Off | Compact spacing |

### Theming

| Setting | Type | Description |
|---------|------|-------------|
| **Accent Color** | Color | Button and selection color |
| **Chip Style** | Rounded/Square | Active chip appearance |
| **Border Radius** | Number | Control corner roundness |

---

## 🏗️ Technical Details

### Built With

- **TypeScript** 5.3.3
- **Power BI Visuals API** 5.9.0
- **Power BI Visuals Tools** 5.4.0
- **powerbi-models** 5.2.0
- **D3.js** 7.9.0

### Filter API Used

| Filter Type | Power BI API |
|-------------|--------------|
| Category | `BasicFilter` with "In" operator |
| Numeric Range | `AdvancedFilter` with "And" conditions |
| Date | `RelativeDateFilter` with dynamic periods |
| Top N | `TopNFilter` with measure ranking |

### Browser Compatibility

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

---

## 🔍 Troubleshooting

### Common Issues

**Date filter not showing**
- Ensure field is in "Date Fields" well (not Category Fields)
- Check browser console for `dateCount` in logs
- Verify field is Date/DateTime data type

**Filters not affecting other visuals**
- Check Filter Scope setting (should be "Page" or "Report")
- Verify other visuals use same data tables
- Check for conflicting filters

**Top N not working**
- Ensure BOTH Category Fields AND Top N Measure are added
- Verify measure contains numeric values
- Check that selected category exists in dropdown

**Performance issues**
- Enable Dense Mode for many filters
- Use Commit Mode instead of Instant
- Limit high-cardinality category fields

### Debug Mode

Enable browser console (F12) to see diagnostic logs:

```javascript
// Check data extraction
Filter Panel: extractData called
Filter Panel: Extracted data { categoryCount: 2, dateCount: 1, ... }

// Check field detection
Filter Panel: Category 0 { displayName: "Product", isDateField: false }
```

---

## 📊 Performance

### Optimization Features

- **Data Reduction**: Limits to 10,000 unique values per field
- **Efficient State Management**: Uses Maps and Sets for O(1) operations
- **DOM Batching**: Minimizes reflows with document fragments
- **Conditional Rendering**: Only renders visible controls

### Benchmarks

| Scenario | Performance |
|----------|-------------|
| 1,000 category values | Smooth |
| 5,000 category values | Good |
| 10,000 category values | Acceptable |
| Multiple filters (4-6) | Good |
| Large datasets (1M+ rows) | Use Commit Mode |

---

## 🛡️ Security

- ✅ No `innerHTML` usage (XSS prevention)
- ✅ All user input sanitized via `textContent`
- ✅ No external API calls
- ✅ No data transmission outside Power BI
- ✅ Client-side processing only

---

## 🔄 Version History

### v1.0.0 (2025-11-03)

**Initial Release**
- Category Filter with search and bulk actions
- Numeric Range Filter with validation
- Date Filter with relative periods
- Top N Filter with measure ranking
- Active Filter Chips display
- Multi-field support
- Configurable scope and apply modes
- OUCRU theming
- Comprehensive documentation

---

## 📄 License

Copyright (c) 2025 OUCRU Developer

---

## 👥 Author

**OUCRU Developer**  
Email: developer@oucru.org  
Support: https://github.com/oucru/filter-panel/issues

---

## 🤝 Contributing

This is a custom Power BI visual developed for OUCRU. For bug reports or feature requests, please contact the development team.

---

## 📞 Support

### Documentation

- **User Guide**: See [USER_GUIDE.md](USER_GUIDE.md)
- **Technical Docs**: See [TECHNICAL_BEHAVIOR.md](TECHNICAL_BEHAVIOR.md)
- **Quick Reference**: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### Contact

- **Email**: developer@oucru.org
- **Support Portal**: https://oucru.org/support
- **GitHub Issues**: (if applicable)

### Reporting Issues

When reporting issues, please include:
1. Power BI Desktop version
2. Browser console logs (F12 → Console)
3. Screenshot of the visual
4. Steps to reproduce
5. Expected vs actual behavior

---

## 🎓 Resources

### Power BI Custom Visuals
- [Power BI Visuals Documentation](https://docs.microsoft.com/en-us/power-bi/developer/visuals/)
- [Power BI Visuals API](https://microsoft.github.io/PowerBI-visuals/docs/overview/)
- [Power BI Filter API](https://learn.microsoft.com/en-us/javascript/api/overview/powerbi/filter-api)

### Development Tools
- [powerbi-visuals-tools](https://www.npmjs.com/package/powerbi-visuals-tools)
- [powerbi-models](https://www.npmjs.com/package/powerbi-models)
- [D3.js Documentation](https://d3js.org/)

---

## 🌟 Acknowledgments

Built with the Power BI Visuals SDK and following Microsoft's best practices for custom visual development.

---

**Made with ❤️ for Power BI**

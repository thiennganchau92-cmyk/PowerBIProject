# Filter Panel Visual - Quick Reference Card

## Filter Types at a Glance

### 🏷️ **Category Filter**
| Property | Value |
|----------|-------|
| **Use For** | Text/categorical data (Product, Region, Status) |
| **Data Well** | Category Fields |
| **Power BI Filter** | BasicFilter (In operator) |
| **User Actions** | Check/uncheck values, Search, Select All, Invert, Clear |
| **Apply Timing** | Instant (default) or Commit mode |
| **Example** | Filter by Product Category = "Electronics" OR "Clothing" |

**Quick Tips:**
- ✅ Supports multiple selections
- ✅ Has search functionality (click 🔍)
- ✅ Use "Select All" for bulk selection
- ⚠️ Limited to 10,000 unique values per field

---

### 🔢 **Numeric Range Filter**
| Property | Value |
|----------|-------|
| **Use For** | Continuous numeric measures (Price, Quantity, Revenue) |
| **Data Well** | Numeric Fields |
| **Power BI Filter** | AdvancedFilter (GreaterThanOrEqual AND LessThanOrEqual) |
| **User Actions** | Enter Min and Max values, Click "Apply Range" |
| **Apply Timing** | On button click |
| **Example** | Filter where 100 ≤ Price ≤ 1000 |

**Quick Tips:**
- ✅ Validates Min ≤ Max
- ✅ Supports decimal numbers
- ✅ Default values show data range
- ⚠️ Both values create AND condition (must be in range)

---

### 📅 **Date Filter**
| Property | Value |
|----------|-------|
| **Use For** | Date/datetime columns (Order Date, Ship Date) |
| **Data Well** | Date Fields |
| **Power BI Filter** | RelativeDateFilter (dynamic time periods) |
| **User Actions** | Select from dropdown, Click "Apply Date Filter" |
| **Apply Timing** | On button click |
| **Example** | Filter to "Last 30 Days" (auto-updates daily) |

**Available Options:**
- Last 7 Days
- Last 30 Days
- Last 3 Months
- Last 12 Months
- This Year

**Quick Tips:**
- ✅ Dynamic filters (recalculate on report open)
- ✅ Includes today by default
- ✅ Automatically timezone-aware
- ⚠️ Only relative dates (no absolute date pickers yet)

---

### 🏆 **Top N Filter**
| Property | Value |
|----------|-------|
| **Use For** | Ranking scenarios (Top 10 Products, Bottom 5 Regions) |
| **Data Wells** | Category Fields + Top N Measure |
| **Power BI Filter** | TopNFilter (measure-based ranking) |
| **User Actions** | Select Category, Select Measure, Enter Count, Choose Direction |
| **Apply Timing** | On button click |
| **Example** | Show Top 10 Products by Total Sales |

**Required Inputs:**
1. **Category** - What to filter (e.g., Product Name)
2. **Measure** - What to rank by (e.g., Total Sales)
3. **Count** - How many items (e.g., 10)
4. **Direction** - Top (highest) or Bottom (lowest)

**Quick Tips:**
- ✅ Dynamically recalculates rankings
- ✅ Can rank by any measure
- ✅ Works with any categorical field
- ⚠️ Requires both category AND measure to work

---

## Settings Overview

### Panel Settings

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| **Filter Scope** | Visual, Page, Report | Page | Where filters apply |
| **Apply Mode** | Instant, Commit | Instant | When filters activate |
| **Show Active Filters** | On, Off | On | Display filter chips |
| **Show Reset Button** | On, Off | On | Display reset button |
| **Dense Mode** | On, Off | Off | Compact spacing |

### Theming

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Accent Color** | Color | Blue (#0078D4) | Button and selection color |
| **Chip Style** | Rounded, Square | Rounded | Active chip shape |
| **Border Radius** | Number | 4 | Control corner roundness |

---

## Data Wells

| Well Name | Type | Purpose | Example Fields |
|-----------|------|---------|---------------|
| **Category Fields** | Grouping | Category filtering | Product, Region, Status |
| **Date Fields** | Grouping | Date filtering | Order Date, Ship Date |
| **Numeric Fields** | Measure | Range filtering | Price, Quantity, Revenue |
| **Top N Measure** | Measure | Top N ranking | Total Sales, Count |

---

## Common Workflows

### Workflow 1: Simple Category Filter
```
1. Drag "Product Category" to Category Fields
2. Visual shows list of categories with checkboxes
3. Check "Electronics" and "Clothing"
4. Filter applies (instant mode)
5. Active chip shows: "Product Category: Electronics, Clothing"
```

### Workflow 2: Price Range Filter
```
1. Drag "Price" measure to Numeric Fields
2. Visual shows Min/Max input fields
3. Enter Min: 50, Max: 200
4. Click "Apply Range" button
5. Filter applies: 50 ≤ Price ≤ 200
```

### Workflow 3: Recent Orders
```
1. Drag "Order Date" to Date Fields
2. Visual shows relative date dropdown
3. Select "Last 30 Days"
4. Click "Apply Date Filter"
5. Shows orders from past 30 days (updates daily)
```

### Workflow 4: Top Performers
```
1. Drag "Product Name" to Category Fields
2. Drag "Total Sales" to Top N Measure
3. Top N section appears
4. Select Category: "Product Name"
5. Select Measure: "Total Sales"
6. Enter Count: 10
7. Select Direction: "Top"
8. Click "Apply Top N Filter"
9. Shows top 10 products by sales
```

---

## Active Filter Chips

**Chip Format Examples:**

| Filter Type | Chip Display |
|------------|--------------|
| Category | `Product: Electronics, Clothing, Home` |
| Numeric | `Price: 50 - 200` |
| Date | `Order Date: Last 30 Days` |
| Top N | `Top 10 Product by Sales` |

**Chip Actions:**
- Click **✕** to remove individual filter
- Scroll horizontally if many active filters
- Auto-updates when filters change

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle search | Click 🔍 icon |
| Check multiple items | Click each checkbox |
| Apply numeric filter | Enter in inputs → Click "Apply Range" |
| Remove filter | Click ✕ on chip |
| Reset all | Click "Reset All Filters" button |

*Note: Standard keyboard navigation (Tab, Enter, Space) works with all controls*

---

## Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Date filter not showing | Ensure field is in "Date Fields" well, not Category Fields |
| Filters not applying | Check Filter Scope setting (should be Page or Report) |
| Top N not working | Verify both Category AND Measure are added |
| Values cut off at 10,000 | This is by design for performance |
| Can't find field | Use search feature (🔍 icon) in category filter |

---

## Filter Scope Explained

| Scope | Effect | Use When |
|-------|--------|----------|
| **Visual** | Only this Filter Panel visual | Testing or visual-specific filtering |
| **Page** | All visuals on current page | Page-level filtering (most common) |
| **Report** | All visuals across all pages | Report-wide filtering (use carefully) |

---

## Apply Mode Explained

| Mode | Behavior | Use When |
|------|----------|----------|
| **Instant** | Filters apply immediately on change | Fast reports, simple filters |
| **Commit** | Filters apply when clicking "Apply" | Slow reports, complex filters, reviewing before applying |

---

## Filter API Reference

| Filter Type | Power BI API | Filter Type ID |
|-------------|--------------|----------------|
| Category | BasicFilter | 1 |
| Numeric | AdvancedFilter | 2 |
| Top N | TopNFilter | 3 |
| Date | RelativeDateFilter | 4 |

---

## Performance Tips

✅ **DO:**
- Use Date Filter instead of Category Filter for dates (more efficient)
- Limit number of simultaneous filters
- Use Dense Mode if you have many filters
- Use Commit Mode for slow reports

❌ **DON'T:**
- Add extremely high-cardinality fields (millions of values)
- Use Report scope unless necessary
- Apply too many filters simultaneously on large datasets

---

## Browser Console Debugging

**Open Console:** Press `F12` → Console tab

**Look for these logs:**
```javascript
Filter Panel: extractData called
// Shows: categoriesCount, valuesCount

Filter Panel: Category 0
// Shows: displayName, queryName, roles, isDateField

Filter Panel: Extracted data
// Shows: categoryCount, numericCount, dateCount, measureCount
```

**If dateCount = 0:** Date field not extracted, check capabilities.json  
**If roles is empty:** Field doesn't have proper role assignment

---

## Quick Start Checklist

- [ ] Install Filter Panel visual in Power BI
- [ ] Drag fields to appropriate data wells
- [ ] Configure Filter Scope (usually "Page")
- [ ] Choose Apply Mode (Instant or Commit)
- [ ] Enable Active Filter Chips
- [ ] Set Accent Color to match report theme
- [ ] Test each filter type
- [ ] Verify filters affect other visuals

---

## Support Resources

📄 **USER_GUIDE.md** - Detailed usage instructions for each filter  
🔧 **TECHNICAL_BEHAVIOR.md** - Architecture and implementation details  
📋 **FilterPaneltrackPlan.md** - Development tracking and change log

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-03  
**For:** Power BI Custom Visuals

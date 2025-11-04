# Filter Panel Visual - User Guide

## Overview

The Filter Panel Visual is a comprehensive filtering solution for Power BI that provides multiple filter types in a unified, user-friendly interface. It supports Category, Numeric Range, Date, and Top N filtering with instant or commit modes.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Category Filter](#1-category-filter)
3. [Numeric Range Filter](#2-numeric-range-filter)
4. [Date Filter](#3-date-filter)
5. [Top N Filter](#4-top-n-filter)
6. [Active Filter Chips](#active-filter-chips)
7. [Settings & Configuration](#settings--configuration)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Adding Fields to the Filter Panel

The Filter Panel has four data wells in the Fields pane:

1. **Category Fields** - Drop categorical/text columns here
2. **Date Fields** - Drop date/datetime columns here
3. **Numeric Fields** - Drop numeric measures here for range filtering
4. **Top N Measure** - Drop measures here for Top N filtering

Simply drag and drop fields from your data model into the appropriate wells.

---

## 1. Category Filter

### Behavior Logic

The Category Filter displays unique values from categorical columns and allows users to select specific values to filter the report. Each category field you add will create a separate filter control.

**How it works:**
- Extracts all unique values from the categorical column
- Displays values in a scrollable list with checkboxes
- Applies a Basic Filter (inclusion filter) to Power BI
- Supports multiple selections
- Optional search functionality to find values quickly

**Filter Type Used:** `BasicFilter` with "In" operator

**Filter Scope:** Visual-level, Page-level, or Report-level (configurable in settings)

---

### Usage Instructions

#### Adding a Category Filter

1. **Add Field:**
   - Drag a categorical column (e.g., Product Category, Region, Customer Name) to the **Category Fields** well

2. **View Filter Control:**
   - The visual displays a control section with the field name as header
   - All unique values appear as checkboxes
   - Values are listed in alphabetical order

#### Selecting Values

**Method 1: Manual Selection**
- Click checkboxes next to values you want to include
- Selected values show a checkmark
- Unselected values are excluded from the filter

**Method 2: Search & Select**
- Click the search icon (🔍) to show the search box
- Type text to filter the value list
- Click checkboxes for matching values
- Click 🔍 again to hide search and show all values

**Method 3: Bulk Actions**
- **Select All:** Click "Select All" button to check all values
- **Invert:** Click "Invert" button to flip selection (checked ↔ unchecked)
- **Clear:** Click "Clear" button to uncheck all values

#### Applying the Filter

**Instant Mode (Default):**
- Filters apply automatically as you click checkboxes
- No apply button needed
- Changes take effect immediately

**Commit Mode:**
- Changes are pending until you click "Apply" button
- Click "Apply" to commit all selections
- Allows reviewing changes before applying

#### Removing the Filter

**Method 1:** Click the "Clear" button to deselect all values
**Method 2:** Click the ✕ on the active filter chip (if chips are enabled)
**Method 3:** Click "Reset All Filters" button to clear all filters

---

### Example Use Cases

- Filter sales data by **Product Category** (Electronics, Clothing, Home)
- Filter customers by **Region** (North, South, East, West)
- Filter orders by **Status** (Pending, Shipped, Delivered, Cancelled)
- Filter products by **Brand** name

---

## 2. Numeric Range Filter

### Behavior Logic

The Numeric Range Filter allows filtering numeric measures within a specified minimum and maximum range. It's designed for continuous numeric data.

**How it works:**
- Analyzes the numeric column to find min/max values
- Displays two input fields for user-defined range
- Applies an Advanced Filter with "GreaterThanOrEqual" AND "LessThanOrEqual" operators
- Validates that min ≤ max before applying
- Supports decimal/floating-point numbers

**Filter Type Used:** `AdvancedFilter` with "And" logic

**Filter Scope:** Visual-level, Page-level, or Report-level (configurable in settings)

---

### Usage Instructions

#### Adding a Numeric Range Filter

1. **Add Field:**
   - Drag a numeric measure (e.g., Sales Amount, Quantity, Price) to the **Numeric Fields** well

2. **View Filter Control:**
   - The visual displays a control section with the field name as header
   - Two input fields appear: **Min** and **Max**
   - Default values show the actual data range

#### Setting the Range

1. **Min Value:**
   - Click the "Min:" input field
   - Enter your minimum threshold value
   - Example: Enter `100` to include values ≥ 100

2. **Max Value:**
   - Click the "Max:" input field
   - Enter your maximum threshold value
   - Example: Enter `1000` to include values ≤ 1000

3. **Apply:**
   - Click the "Apply Range" button
   - Filter applies: includes all rows where `Min ≤ value ≤ Max`

#### Validation

- If Min > Max, the filter will not apply (invalid range)
- Only valid numeric values are accepted
- Empty fields use default min/max from data

#### Removing the Filter

**Method 1:** Click the ✕ on the active filter chip
**Method 2:** Click "Reset All Filters" button to clear all filters

---

### Example Use Cases

- Filter products with **Price** between $50 and $200
- Show orders with **Quantity** between 10 and 100 units
- Display items with **Discount %** between 5% and 25%
- Filter stores by **Revenue** between $1M and $5M

---

## 3. Date Filter

### Behavior Logic

The Date Filter provides relative date filtering using predefined time periods (Last 7 Days, Last 30 Days, etc.). It's designed for quick, dynamic date-based filtering.

**How it works:**
- Detects date/datetime columns
- Provides dropdown with relative date options
- Applies a Relative Date Filter that dynamically calculates date ranges
- Updates automatically (e.g., "Last 7 Days" always means the 7 days preceding today)
- Includes today by default

**Filter Type Used:** `RelativeDateFilter` with dynamic date calculations

**Filter Scope:** Visual-level, Page-level, or Report-level (configurable in settings)

---

### Usage Instructions

#### Adding a Date Filter

1. **Add Field:**
   - Drag a date column (e.g., Order Date, Ship Date, Created Date) to the **Date Fields** well

2. **View Filter Control:**
   - The visual displays a control section with the field name as header
   - A dropdown menu appears with relative date options

#### Selecting a Time Period

1. **Click the Dropdown:**
   - Opens list of predefined time periods

2. **Available Options:**
   - **Last 7 Days** - Data from the past 7 days
   - **Last 30 Days** - Data from the past 30 days
   - **Last 3 Months** - Data from the past 3 months
   - **Last 12 Months** - Data from the past 12 months
   - **This Year** - Data from January 1st of current year to today

3. **Apply:**
   - Select your desired option
   - Click "Apply Date Filter" button
   - Filter applies dynamically

#### How Relative Dates Work

- **"Last N Days"** counts backward from today
  - Example: If today is Nov 3, 2025, "Last 7 Days" = Oct 27 - Nov 3
  
- **"Last N Months"** counts backward N complete months
  - Example: If today is Nov 3, 2025, "Last 3 Months" = Aug 1 - Nov 3
  
- **"This Year"** includes from Jan 1 to today
  - Example: If today is Nov 3, 2025, "This Year" = Jan 1, 2025 - Nov 3, 2025

- **Auto-updates:** Filter recalculates each time report opens

#### Removing the Filter

**Method 1:** Click the ✕ on the active filter chip
**Method 2:** Click "Reset All Filters" button to clear all filters

---

### Example Use Cases

- Show **Orders** from the last 30 days
- Display **Sales** for this year only
- Filter **Shipments** from the last 7 days
- View **Transactions** from the last 3 months

---

## 4. Top N Filter

### Behavior Logic

The Top N Filter displays the top (or bottom) N values of a category field, ranked by a measure. It's ideal for finding the highest or lowest performing items.

**How it works:**
- Requires two inputs: a category field to filter and a measure to rank by
- Sorts category values by the measure (descending for Top, ascending for Bottom)
- Applies a Top N Filter that includes only the top/bottom N items
- Dynamically recalculates when data changes

**Filter Type Used:** `TopNFilter` with measure-based ranking

**Filter Scope:** Visual-level, Page-level, or Report-level (configurable in settings)

---

### Usage Instructions

#### Setup Required

1. **Add Category Field:**
   - Drag a categorical column to **Category Fields** well
   - This is the field that will be filtered (e.g., Product, Customer, Region)

2. **Add Measure:**
   - Drag a measure to **Top N Measure** well
   - This is used to rank the category (e.g., Sales Amount, Quantity)

#### Using the Top N Filter

1. **View Filter Control:**
   - The "Top N Filter" section appears at the bottom
   - Contains three configuration options

2. **Select Category:**
   - Click the "Category:" dropdown
   - Choose which category field to filter
   - Example: Select "Product Name"

3. **Select Measure:**
   - Click the "Order by Measure:" dropdown
   - Choose which measure to rank by
   - Example: Select "Total Sales"

4. **Set Count:**
   - Enter the number N in the "Count:" field
   - Example: Enter `10` for top 10 items
   - Default: 10

5. **Choose Direction:**
   - Click the "Direction:" dropdown
   - **Top** - Shows highest values (largest to smallest)
   - **Bottom** - Shows lowest values (smallest to largest)

6. **Apply:**
   - Click "Apply Top N Filter" button
   - Filter applies to show only top/bottom N items

#### Examples

**Example 1: Top 10 Products by Sales**
- Category: Product Name
- Measure: Total Sales
- Count: 10
- Direction: Top
- **Result:** Shows only the 10 products with highest sales

**Example 2: Bottom 5 Regions by Customer Count**
- Category: Region
- Measure: Customer Count
- Count: 5
- Direction: Bottom
- **Result:** Shows only the 5 regions with fewest customers

#### Removing the Filter

**Method 1:** Click the ✕ on the active filter chip
**Method 2:** Click "Reset All Filters" button to clear all filters

---

### Example Use Cases

- Show **Top 10 Customers** by Revenue
- Display **Bottom 5 Products** by Units Sold
- Filter **Top 20 Sales Reps** by Deal Count
- Show **Top 3 Regions** by Profit Margin

---

## Active Filter Chips

### Behavior

Active Filter Chips display at the top of the visual (if enabled in settings) showing all currently applied filters.

**Chip Display Format:**
- **Category Filter:** "FieldName: Value1, Value2, Value3..."
- **Numeric Filter:** "FieldName: Min - Max"
- **Date Filter:** "FieldName: Last N Days/Months/Year"
- **Top N Filter:** "Top/Bottom N Category by Measure"

**Chip Actions:**
- **View:** See all active filters at a glance
- **Remove:** Click the ✕ button on any chip to remove that filter
- **Scroll:** If many filters, chips area is scrollable

**Settings:**
- Enable/disable in Format pane → Panel Settings → Show Active Filters

---

## Settings & Configuration

### Panel Settings

Access via Format pane → Panel Settings:

1. **Filter Scope**
   - **Visual:** Affects only this visual
   - **Page:** Affects all visuals on current page
   - **Report:** Affects all visuals across all pages

2. **Apply Mode**
   - **Instant:** Filters apply immediately on selection
   - **Commit:** Filters apply when "Apply" button is clicked

3. **Show Active Filters**
   - Toggle ON/OFF to show/hide active filter chips

4. **Show Reset Button**
   - Toggle ON/OFF to show/hide "Reset All Filters" button

5. **Dense Mode**
   - Toggle ON for compact spacing (more filters visible)
   - Toggle OFF for comfortable spacing (easier to read)

### Theming

Access via Format pane → Theming:

1. **Accent Color**
   - Change the color of buttons and selected items
   - Default: Blue (#0078D4)

2. **Chip Style**
   - **Rounded:** Chips have rounded corners
   - **Square:** Chips have sharp corners

3. **Border Radius**
   - Fine-tune the roundness (0 = square, higher = rounder)

---

## Troubleshooting

### Date Filter Not Showing

**Problem:** Date column added but no date filter appears

**Solutions:**
1. Verify the column is truly a Date/DateTime data type in Power BI
2. Check browser console for debug logs (F12 → Console)
3. Look for: `Filter Panel: Extracted data` log showing `dateCount: 1`
4. Ensure field is in **Date Fields** well, not Category Fields well

### Filters Not Applying

**Problem:** Selected filters don't affect other visuals

**Solutions:**
1. Check **Filter Scope** setting:
   - Set to "Page" or "Report" to affect other visuals
   - "Visual" scope only affects the Filter Panel itself
2. Verify apply mode - if "Commit", click "Apply" button
3. Check if other visuals have conflicting filters applied

### Values Not Showing in Category Filter

**Problem:** Category filter is empty or shows no values

**Solutions:**
1. Verify the field has data (not all nulls)
2. Check data reduction algorithm in capabilities (default: top 10,000)
3. Look at console logs for extraction errors
4. Refresh the visual (Ctrl+F5)

### Top N Filter Not Working

**Problem:** Top N filter doesn't apply or shows wrong items

**Solutions:**
1. Ensure both Category Field AND Top N Measure are added
2. Verify measure has numeric values (not text)
3. Check console for errors
4. Try a different combination to isolate the issue

---

## Best Practices

1. **Use Appropriate Filter Types:**
   - Category Filter → Text/categorical data
   - Date Filter → Date/datetime columns only
   - Numeric Filter → Continuous numeric measures
   - Top N → Ranking scenarios

2. **Filter Scope:**
   - Use "Visual" for testing
   - Use "Page" for page-level filtering
   - Use "Report" sparingly (affects entire report)

3. **Performance:**
   - Limit number of simultaneous filters
   - Use Date Filter over Category Filter for dates (more efficient)
   - Consider data reduction for high-cardinality category fields

4. **User Experience:**
   - Enable Active Filter Chips so users see what's filtered
   - Use Commit Mode if filters are expensive (slow reports)
   - Enable Dense Mode if you have many filter controls

---

## Technical Details

### Filter API Used

| Filter Type | Power BI Filter API | Operators |
|------------|-------------------|-----------|
| Category | BasicFilter | In |
| Numeric Range | AdvancedFilter | GreaterThanOrEqual AND LessThanOrEqual |
| Date | RelativeDateFilter | InLast, InThis |
| Top N | TopNFilter | Top, Bottom |

### Data Extraction

- **Category Fields:** Extracted from `dataView.categorical.categories`
- **Date Fields:** Extracted from `dataView.categorical.categories` (role: dateFields)
- **Numeric Fields:** Extracted from `dataView.categorical.values` (role: numericFields)
- **Measures:** Extracted from `dataView.categorical.values` (role: topByMeasure)

### Column References

All filters use proper table.column references:
- Parsed from `source.queryName` (format: "TableName.ColumnName")
- Ensures filters work correctly across relationships

---

## Support & Debugging

### Browser Console Logs

Enable browser console (F12) to see debug logs:

- `Filter Panel: extractData called` - Shows data structure
- `Filter Panel: Category N` - Shows each field's roles
- `Filter Panel: Extracted data` - Shows final extracted counts

### Common Console Messages

✅ **Good:** `dateCount: 1, dateData: [...]` - Date field extracted successfully
❌ **Bad:** `dateCount: 0` - Date field not detected, check dataViewMappings

---

## Version History

- **v1.0.0** - Initial release with all four filter types
- Multi-field support for categories, dates, and numerics
- Active filter chips and reset functionality
- Comprehensive theming and settings

---

**Need Help?** Check the console logs or review the Plan.md file for technical implementation details.

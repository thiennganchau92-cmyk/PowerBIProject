# Filter Panel Visual - Technical Behavior Documentation

## Architecture Overview

The Filter Panel Visual is a custom Power BI visual that provides a unified interface for multiple filter types. It uses the Power BI Visuals API and applies filters through the IVisualHost filter API.

---

## Table of Contents

1. [Data Flow](#data-flow)
2. [Filter Type Behaviors](#filter-type-behaviors)
3. [State Management](#state-management)
4. [Event Handling](#event-handling)
5. [Rendering Pipeline](#rendering-pipeline)
6. [API Integration](#api-integration)

---

## Data Flow

### 1. Data Extraction Flow

```
Power BI DataView
    ↓
Visual.update(options: VisualUpdateOptions)
    ↓
extractData(options)
    ↓
Parse dataView.categorical structure
    ↓
Categorize by roles:
    - categoryFields → categoryData[]
    - dateFields → dateData[]
    - numericFields → numericData[]
    - topByMeasure → measureData[]
    ↓
Store in instance variables
    ↓
renderControls()
```

### 2. Filter Application Flow

```
User Interaction (checkbox, button, input)
    ↓
Event Handler (click, change)
    ↓
Update Internal State (selectedCategories, numericRanges, etc.)
    ↓
Build Filter Object (BasicFilter, AdvancedFilter, etc.)
    ↓
Apply via IVisualHost.applyJsonFilter()
    ↓
Power BI applies filter to data model
    ↓
Other visuals update
    ↓
renderActiveChips() updates chip display
```

---

## Filter Type Behaviors

### 1. Category Filter (BasicFilter)

#### Internal Logic

**Data Structure:**
```typescript
interface CategoryData {
    table: string;        // Table name from queryName
    column: string;       // Column name from queryName
    displayName: string;  // Display name for UI
    values: any[];       // Unique values from data
}

// State management
selectedCategories: Map<string, Set<any>>
// Key format: "table.column"
// Value: Set of selected values
```

**Extraction Process:**
1. Iterate through `dataView.categorical.categories`
2. Check if `source.roles['categoryFields']` is true
3. Parse `source.queryName` to extract table and column
4. Store all unique values from `category.values`
5. Create Map entry with field key

**Filter Building:**
```typescript
buildBasicFilter(
    table: string,
    column: string,
    values: any[]
): models.IBasicFilter
```

**Filter Structure:**
```json
{
    "$schema": "http://powerbi.com/product/schema#basic",
    "target": {
        "table": "Products",
        "column": "Category"
    },
    "operator": "In",
    "values": ["Electronics", "Clothing", "Home"],
    "filterType": 1
}
```

**State Updates:**
- On checkbox change → Update Set in selectedCategories Map
- On Select All → Add all values to Set
- On Clear → Clear Set for that field
- On Invert → Toggle each value in Set

**Rendering Logic:**
```typescript
renderCategoryControl(categoryData: CategoryData)
    ↓
Create control-section div
    ↓
Render header with field name
    ↓
Render search box (optional, toggled by icon)
    ↓
Render value list:
        For each unique value:
            - Create checkbox
            - Check if value in selectedCategories Set
            - Attach change event handler
    ↓
Render action buttons (Select All, Invert, Clear)
```

**Apply Logic:**
- **Instant Mode:** Apply on every checkbox change
- **Commit Mode:** Store pending changes, apply on button click

---

### 2. Numeric Range Filter (AdvancedFilter)

#### Internal Logic

**Data Structure:**
```typescript
interface NumericData {
    table: string;
    column: string;
    displayName: string;
    min: number;         // Minimum value in data
    max: number;         // Maximum value in data
}

interface NumericRange {
    min: number;
    max: number;
}

// State management
numericRanges: Map<string, NumericRange>
// Key: "table.column"
// Value: {min, max} object
```

**Extraction Process:**
1. Iterate through `dataView.categorical.values`
2. Check if `source.roles['numericFields']` is true
3. Parse `source.queryName` for table/column
4. Calculate min/max from `measure.values`
5. Filter out null/undefined values
6. Store data range as default values

**Filter Building:**
```typescript
buildAdvancedFilter(
    table: string,
    column: string,
    min: number,
    max: number
): models.IAdvancedFilter
```

**Filter Structure:**
```json
{
    "$schema": "http://powerbi.com/product/schema#advanced",
    "target": {
        "table": "Sales",
        "column": "Amount"
    },
    "logicalOperator": "And",
    "conditions": [
        {
            "operator": "GreaterThanOrEqual",
            "value": 100
        },
        {
            "operator": "LessThanOrEqual",
            "value": 1000
        }
    ],
    "filterType": 2
}
```

**Validation Logic:**
```typescript
// Before applying
if (!isNaN(min) && !isNaN(max) && min <= max) {
    applyNumericFilter(numericData, {min, max});
}
```

**State Updates:**
- On "Apply Range" click:
  - Read min/max input values
  - Validate range
  - Store in numericRanges Map
  - Build and apply filter

**Rendering Logic:**
```typescript
renderNumericControl(numericData: NumericData)
    ↓
Create control-section div
    ↓
Render header
    ↓
Render form-row with Min input:
        - type="number"
        - step="any" (allows decimals)
        - default: data min value
    ↓
Render form-row with Max input:
        - type="number"
        - step="any"
        - default: data max value
    ↓
Render "Apply Range" button
```

---

### 3. Date Filter (RelativeDateFilter)

#### Internal Logic

**Data Structure:**
```typescript
interface DateData {
    table: string;
    column: string;
    displayName: string;
    minDate: Date;      // Earliest date in data
    maxDate: Date;      // Latest date in data
}

interface RelativeDateConfig {
    operator: string;             // "InLast" or "InThis"
    timeUnitsCount?: number;      // Number of units
    timeUnit?: string;            // "Days", "Months", "Years"
    includeToday: boolean;
}

// State management
relativeDateConfigs: Map<string, RelativeDateConfig>
// Key: "table.column"
```

**Extraction Process:**
1. Iterate through `dataView.categorical.categories`
2. Check if `source.roles['dateFields']` is true
3. Parse `source.queryName` for table/column
4. Convert `category.values` to Date objects
5. Calculate min/max dates for reference
6. Store date range metadata

**Filter Building:**
```typescript
buildRelativeDateFilter(
    table: string,
    column: string,
    operator: models.RelativeDateOperators,
    timeUnitsCount: number,
    timeUnit: models.RelativeDateFilterTimeUnit,
    includeToday: boolean
): models.IRelativeDateFilter
```

**Filter Structure:**
```json
{
    "$schema": "http://powerbi.com/product/schema#relativeDate",
    "target": {
        "table": "Orders",
        "column": "OrderDate"
    },
    "operator": "InLast",
    "timeUnitsCount": 7,
    "timeUnit": "Days",
    "includeToday": true,
    "filterType": 4
}
```

**Option Parsing:**
```typescript
// User selects: "InLast-7-Days"
const [operator, count, unit] = selected.split("-");
// operator = "InLast"
// count = "7"
// unit = "Days"

buildRelativeDateFilter(
    table, column,
    operator as models.RelativeDateOperators,
    parseInt(count),
    unit as models.RelativeDateFilterTimeUnit,
    true
);
```

**Available Options:**
```typescript
const options = [
    { value: "InLast-7-Days", text: "Last 7 Days" },
    { value: "InLast-30-Days", text: "Last 30 Days" },
    { value: "InLast-3-Months", text: "Last 3 Months" },
    { value: "InLast-12-Months", text: "Last 12 Months" },
    { value: "InThis-Year", text: "This Year" }
];
```

**State Updates:**
- On dropdown change and "Apply" click:
  - Parse selected option value
  - Extract operator, count, unit
  - Store config in relativeDateConfigs Map
  - Build and apply filter

**Rendering Logic:**
```typescript
renderDateControl(dateData: DateData)
    ↓
Create control-section div
    ↓
Render header
    ↓
Render label "Relative Date:"
    ↓
Render dropdown select:
        For each option:
            - Create option element
            - Set value and text
            - Append to select
    ↓
Render "Apply Date Filter" button
```

**Dynamic Behavior:**
- Filter recalculates each time report opens
- "Last 7 Days" always means 7 days before current date
- Automatically adjusts for timezone

---

### 4. Top N Filter (TopNFilter)

#### Internal Logic

**Data Structure:**
```typescript
interface MeasureData {
    table: string;
    column: string;
    displayName: string;
}

interface TopNConfig {
    operator: "Top" | "Bottom";
    itemCount: number;
    orderByTable: string;
    orderByColumn: string;
}

// State management
topNConfigs: Map<string, TopNConfig>
// Key: "categoryTable.categoryColumn"
```

**Extraction Process:**

*For Categories:*
1. Same as Category Filter extraction
2. Provides list of available category fields

*For Measures:*
1. Iterate through `dataView.categorical.values`
2. Check if `source.roles['topByMeasure']` is true
3. Parse `source.queryName` for table/column
4. Store measure metadata (no values needed)

**Filter Building:**
```typescript
buildTopNFilter(
    table: string,
    column: string,
    operator: "Top" | "Bottom",
    itemCount: number,
    orderByTable: string,
    orderByColumn: string
): models.ITopNFilter
```

**Filter Structure:**
```json
{
    "$schema": "http://powerbi.com/product/schema#topN",
    "target": {
        "table": "Products",
        "column": "ProductName"
    },
    "operator": "Top",
    "itemCount": 10,
    "orderBy": {
        "table": "Sales",
        "column": "TotalSales"
    },
    "filterType": 3
}
```

**Input Validation:**
```typescript
// All three inputs required
if (categoryKey && measureKey && count > 0) {
    // Parse table.column from keys
    const [catTable, catColumn] = categoryKey.split(".");
    const [measureTable, measureColumn] = measureKey.split(".");
    
    // Build and apply filter
    applyTopNFilter(...);
}
```

**State Updates:**
- On "Apply Top N Filter" click:
  - Validate all inputs present
  - Extract category and measure info
  - Store config in topNConfigs Map
  - Build and apply filter

**Rendering Logic:**
```typescript
renderTopNControl()
    ↓
Create control-section div
    ↓
Render header "Top N Filter"
    ↓
Render Category dropdown:
        - "Select category..." option
        - Options from categoryData[]
    ↓
Render Measure dropdown:
        - "Select measure..." option
        - Options from measureData[]
    ↓
Render form-row for Count:
        - type="number"
        - min="1"
        - default="10"
    ↓
Render Direction dropdown:
        - "Top" option
        - "Bottom" option
    ↓
Render "Apply Top N Filter" button
```

**How Power BI Processes It:**
1. Ranks all category values by the orderBy measure
2. Takes top/bottom N items based on operator
3. Includes only those items in results
4. Other category values are filtered out

---

## State Management

### Filter State Storage

```typescript
class Visual {
    // Category selections
    private selectedCategories: Map<string, Set<any>>;
    // Key: "Table.Column"
    // Value: Set of selected values
    
    // Numeric ranges
    private numericRanges: Map<string, NumericRange>;
    // Key: "Table.Column"
    // Value: {min, max}
    
    // Date configurations
    private relativeDateConfigs: Map<string, RelativeDateConfig>;
    // Key: "Table.Column"
    // Value: {operator, timeUnitsCount, timeUnit, includeToday}
    
    // Top N configurations
    private topNConfigs: Map<string, TopNConfig>;
    // Key: "Table.Column" (category field)
    // Value: {operator, itemCount, orderByTable, orderByColumn}
    
    // Active filters for chip display
    private activeFilters: ActiveFilter[];
    // Array of {id, filterType, label, table, column}
}
```

### State Lifecycle

1. **Initialization:**
   - All Maps initialized as empty in constructor
   - Arrays initialized as empty

2. **Data Update:**
   - `update()` called by Power BI
   - `extractData()` repopulates data arrays
   - State Maps persist (user selections maintained)

3. **Filter Application:**
   - User action triggers filter method
   - State Map updated
   - Filter built and applied
   - Active filter added to activeFilters array

4. **Filter Removal:**
   - User clicks chip ✕ or Clear button
   - State Map entry cleared
   - `applyJsonFilter()` called with null
   - Active filter removed from array

5. **Reset All:**
   - All Maps cleared
   - All filters set to null
   - activeFilters array cleared
   - UI re-rendered

---

## Event Handling

### Category Filter Events

```typescript
// Checkbox change
checkbox.addEventListener("change", () => {
    const fieldKey = `${table}.${column}`;
    if (checkbox.checked) {
        selectedCategories.get(fieldKey).add(value);
    } else {
        selectedCategories.get(fieldKey).delete(value);
    }
    applyCategoryFilter(categoryData);
});

// Search toggle
searchIcon.addEventListener("click", () => {
    searchBox.style.display = 
        searchBox.style.display === "none" ? "block" : "none";
});

// Select All
selectAllBtn.addEventListener("click", () => {
    selectAllCategories(fieldKey);
});

// Clear
clearBtn.addEventListener("click", () => {
    clearCategorySelection(fieldKey);
});
```

### Numeric Filter Events

```typescript
// Apply button
applyBtn.addEventListener("click", () => {
    const min = parseFloat(minInput.value);
    const max = parseFloat(maxInput.value);
    
    if (!isNaN(min) && !isNaN(max) && min <= max) {
        applyNumericFilter(numericData, {min, max});
    }
});
```

### Date Filter Events

```typescript
// Apply button
applyBtn.addEventListener("click", () => {
    const selected = dropdown.value;
    
    if (selected) {
        const [operator, count, unit] = selected.split("-");
        applyDateFilter(dateData, {
            operator: operator as any,
            timeUnitsCount: parseInt(count),
            timeUnit: unit as any,
            includeToday: true
        });
    }
});
```

### Top N Filter Events

```typescript
// Apply button
applyBtn.addEventListener("click", () => {
    const categoryKey = categorySelect.value;
    const measureKey = measureSelect.value;
    const count = parseInt(countInput.value);
    const operator = directionSelect.value as "Top" | "Bottom";
    
    if (categoryKey && measureKey && count > 0) {
        const [catTable, catColumn] = categoryKey.split(".");
        const [measureTable, measureColumn] = measureKey.split(".");
        
        applyTopNFilter(
            {table: catTable, column: catColumn, ...},
            {operator, itemCount: count, 
             orderByTable: measureTable, 
             orderByColumn: measureColumn}
        );
    }
});
```

### Global Events

```typescript
// Reset All button
resetBtn.addEventListener("click", () => {
    resetAll();
});

// Chip remove
chipRemoveBtn.addEventListener("click", () => {
    removeFilter(filterId);
});
```

---

## Rendering Pipeline

### Update Cycle

```
Power BI calls update(options)
    ↓
Check if dataViews available
    ↓
extractData(options)
    - Parse categorical structure
    - Populate data arrays
    ↓
renderActiveChips()
    - Clear chips container
    - Loop through activeFilters
    - Create chip for each
    ↓
renderControls()
    - Clear controls container
    - Loop through categoryData[]
        → renderCategoryControl()
    - Loop through numericData[]
        → renderNumericControl()
    - Loop through dateData[]
        → renderDateControl()
    - If measureData.length > 0
        → renderTopNControl()
    ↓
renderFooter()
    - Show/hide reset button based on settings
```

### DOM Structure

```html
<div class="filter-panel">
    <!-- Active Chips Section -->
    <div class="active-chips" style="display: block|none">
        <div class="chip">
            <span class="chip-label">Category: Value1, Value2</span>
            <button class="chip-remove">✕</button>
        </div>
        <!-- More chips... -->
    </div>
    
    <!-- Filter Controls Section -->
    <div class="controls-container">
        <!-- Category Control -->
        <div class="control-section">
            <div class="control-header">Product Category</div>
            <div class="search-container">
                <span class="search-icon">🔍</span>
                <input class="search-input" style="display: none">
            </div>
            <div class="values-container">
                <label>
                    <input type="checkbox"> Electronics
                </label>
                <!-- More values... -->
            </div>
            <div class="actions-row">
                <button>Select All</button>
                <button>Invert</button>
                <button>Clear</button>
            </div>
        </div>
        
        <!-- Numeric Control -->
        <div class="control-section">
            <div class="control-header">Sales Amount</div>
            <div class="form-row">
                <label>Min:</label>
                <input type="number">
            </div>
            <div class="form-row">
                <label>Max:</label>
                <input type="number">
            </div>
            <div class="actions-row">
                <button>Apply Range</button>
            </div>
        </div>
        
        <!-- Date Control -->
        <div class="control-section">
            <div class="control-header">Order Date</div>
            <label>Relative Date:</label>
            <select>
                <option value="">Select...</option>
                <option value="InLast-7-Days">Last 7 Days</option>
                <!-- More options... -->
            </select>
            <div class="actions-row">
                <button>Apply Date Filter</button>
            </div>
        </div>
        
        <!-- Top N Control -->
        <div class="control-section">
            <div class="control-header">Top N Filter</div>
            <label>Category:</label>
            <select><!-- category options --></select>
            <label>Order by Measure:</label>
            <select><!-- measure options --></select>
            <div class="form-row">
                <label>Count:</label>
                <input type="number" value="10">
            </div>
            <label>Direction:</label>
            <select>
                <option value="Top">Top</option>
                <option value="Bottom">Bottom</option>
            </select>
            <div class="actions-row">
                <button>Apply Top N Filter</button>
            </div>
        </div>
    </div>
    
    <!-- Footer Section -->
    <div class="footer">
        <button class="reset-btn">Reset All Filters</button>
    </div>
</div>
```

---

## API Integration

### Power BI Visuals API

**Core Interfaces:**
```typescript
import powerbi from "powerbi-visuals-api";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import models = powerbi.models;
```

**Filter Application:**
```typescript
this.host.applyJsonFilter(
    filter: models.IFilter,
    objectName: string,
    propertyName: string,
    action: FilterAction
);

// Parameters:
// - filter: IBasicFilter | IAdvancedFilter | IRelativeDateFilter | ITopNFilter
// - objectName: "general" (standard)
// - propertyName: "filter" (standard)
// - action: FilterAction.merge (apply) or FilterAction.remove (clear)
```

**Filter Clearing:**
```typescript
// Remove specific filter
this.host.applyJsonFilter(
    null,
    "general",
    "filter",
    FilterAction.remove
);
```

### Filter API Models

**1. BasicFilter (models.IBasicFilter):**
```typescript
interface IBasicFilter extends IFilter {
    $schema: string;
    target: IFilterTarget;
    operator: "In" | "NotIn" | "All";
    values: any[];
    filterType: FilterType.Basic; // = 1
}
```

**2. AdvancedFilter (models.IAdvancedFilter):**
```typescript
interface IAdvancedFilter extends IFilter {
    $schema: string;
    target: IFilterTarget;
    logicalOperator: "And" | "Or";
    conditions: IAdvancedFilterCondition[];
    filterType: FilterType.Advanced; // = 2
}

interface IAdvancedFilterCondition {
    operator: "LessThan" | "LessThanOrEqual" | 
              "GreaterThan" | "GreaterThanOrEqual" |
              "Is" | "IsNot" | "IsBlank" | "IsNotBlank";
    value?: any;
}
```

**3. TopNFilter (models.ITopNFilter):**
```typescript
interface ITopNFilter extends IFilter {
    $schema: string;
    target: IFilterTarget;
    operator: "Top" | "Bottom";
    itemCount: number;
    orderBy: IFilterTarget;
    filterType: FilterType.TopN; // = 3
}
```

**4. RelativeDateFilter (models.IRelativeDateFilter):**
```typescript
interface IRelativeDateFilter extends IFilter {
    $schema: string;
    target: IFilterTarget;
    operator: RelativeDateOperators;
    timeUnitsCount?: number;
    timeUnit?: RelativeDateFilterTimeUnit;
    includeToday: boolean;
    filterType: FilterType.RelativeDate; // = 4
}

enum RelativeDateOperators {
    InLast = "InLast",
    InThis = "InThis",
    InNext = "InNext"
}

enum RelativeDateFilterTimeUnit {
    Days = "Days",
    Weeks = "Weeks",
    Months = "Months",
    Years = "Years"
}
```

### Target Structure

```typescript
interface IFilterTarget {
    table: string;    // Table name
    column: string;   // Column name
}
```

**Extraction from queryName:**
```typescript
const queryName = "Sales.OrderDate";
const queryParts = queryName.split(".");
const target: models.IFilterTarget = {
    table: queryParts[0],  // "Sales"
    column: queryParts[1]  // "OrderDate"
};
```

---

## Performance Considerations

### Data Reduction

**capabilities.json:**
```json
"dataReductionAlgorithm": {
    "top": {
        "count": 10000
    }
}
```

- Limits unique values to 10,000 per field
- Prevents performance issues with high-cardinality fields
- Applies to both category and date fields

### Efficient State Management

**Using Maps Instead of Objects:**
```typescript
// Efficient O(1) lookup
selectedCategories.get("Sales.Product");

// Efficient O(1) insertion
selectedCategories.set("Sales.Product", new Set(["A", "B"]));

// Efficient deletion
selectedCategories.delete("Sales.Product");
```

**Using Sets for Values:**
```typescript
// Efficient add/remove for category values
const values = selectedCategories.get(fieldKey);
values.add("Electronics");    // O(1)
values.delete("Clothing");    // O(1)
values.has("Home");           // O(1)
```

### Rendering Optimization

**Document Fragments:**
```typescript
// Batch DOM operations
const fragment = document.createDocumentFragment();
categoryData.forEach(cat => {
    const control = renderCategoryControl(cat);
    fragment.appendChild(control);
});
container.appendChild(fragment);
// Single reflow instead of multiple
```

**Event Delegation (if needed):**
```typescript
// Instead of attaching to each checkbox
valuesContainer.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
        handleCheckboxChange(e.target);
    }
});
```

---

## Error Handling

### Data Validation

```typescript
// Check dataView exists
if (!options.dataViews || !options.dataViews[0]) {
    return;
}

// Check categorical structure
if (!dataView.categorical) {
    return;
}

// Check categories array
if (!dataView.categorical.categories) {
    return;
}

// Null/undefined filtering
const numericValues = values.filter(
    v => v !== null && v !== undefined && typeof v === 'number'
);
```

### Input Validation

```typescript
// Numeric range validation
if (!isNaN(min) && !isNaN(max) && min <= max) {
    // Valid range, apply filter
} else {
    // Invalid, don't apply
}

// Top N validation
if (categoryKey && measureKey && count > 0) {
    // Valid inputs, apply filter
}
```

### Console Logging

```typescript
console.log('Filter Panel: extractData called', {
    hasCategorical: !!dataView.categorical,
    categoriesCount: dataView.categorical?.categories?.length || 0,
    valuesCount: dataView.categorical?.values?.length || 0
});

console.log('Filter Panel: Extracted data', {
    categoryCount: this.categoryData.length,
    numericCount: this.numericData.length,
    dateCount: this.dateData.length,
    measureCount: this.measureData.length
});
```

---

## Debugging Guide

### Common Issues and Diagnostics

**Issue: Date filter not showing**
```typescript
// Check logs:
console.log(`Filter Panel: Category ${index}`, {
    isDateField: roles && roles['dateFields']
});

// Expected: isDateField: true
// If false: Check dataViewMappings in capabilities.json
```

**Issue: Filters not applying**
```typescript
// Verify filter object structure
console.log('Applying filter:', filter);

// Check filter scope setting
console.log('Scope:', this.settings.panelSettings.scope);
```

**Issue: Column not found error**
```typescript
// Verify table.column reference
console.log('QueryName:', source.queryName);
console.log('Parsed:', {
    table: queryParts[0],
    column: queryParts[1]
});

// Should match Power BI data model schema
```

---

## Security Considerations

### XSS Prevention

**NO innerHTML Usage:**
```typescript
// ❌ WRONG
element.innerHTML = userValue;

// ✅ CORRECT
element.textContent = userValue;
// or
const text = document.createTextNode(userValue);
element.appendChild(text);
```

**Safe DOM Manipulation:**
- All user input displayed via `textContent` or `createTextNode()`
- No eval() or Function() constructor used
- No dynamic script injection

### Data Privacy

- No data sent to external servers
- All processing happens client-side in Power BI
- Filter operations use Power BI's native API
- Console logs can be removed for production

---

## Extension Points

### Adding New Filter Types

1. **Define Data Interface:**
```typescript
interface NewFilterData {
    table: string;
    column: string;
    displayName: string;
    // Custom properties...
}
```

2. **Add State Storage:**
```typescript
private newFilterConfigs: Map<string, NewFilterConfig>;
```

3. **Extract in extractData():**
```typescript
if (roles && roles['newFilterRole']) {
    this.newFilterData.push({...});
}
```

4. **Create Render Method:**
```typescript
private renderNewFilterControl(data: NewFilterData): void {
    // Build UI
}
```

5. **Create Apply Method:**
```typescript
private applyNewFilter(data: NewFilterData, config: NewFilterConfig): void {
    const filter = buildNewFilter(...);
    this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
}
```

6. **Update capabilities.json:**
```json
{
    "displayName": "New Filter Fields",
    "name": "newFilterRole",
    "kind": "Grouping" // or "Measure"
}
```

---

## Testing Checklist

- [ ] Category filter with 1 field
- [ ] Category filter with multiple fields
- [ ] Category filter with search
- [ ] Numeric range filter with valid range
- [ ] Numeric range filter with invalid range (min > max)
- [ ] Date filter with each relative option
- [ ] Top N filter with Top direction
- [ ] Top N filter with Bottom direction
- [ ] Multiple filters applied simultaneously
- [ ] Filter scope: Visual, Page, Report
- [ ] Apply mode: Instant vs Commit
- [ ] Active chips display and removal
- [ ] Reset All Filters button
- [ ] High-cardinality fields (10,000+ values)
- [ ] Null/undefined values in data
- [ ] Browser console errors (should be none)

---

## References

- [Power BI Visuals API Documentation](https://microsoft.github.io/PowerBI-visuals/docs/overview/)
- [powerbi-models Package](https://www.npmjs.com/package/powerbi-models)
- [Filter API Reference](https://learn.microsoft.com/en-us/javascript/api/overview/powerbi/filter-api)

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-03

# Power BI Model Documentation
## On-HandList_Ngan_UAT

**Last Updated**: 2025-11-24  
**Model Type**: Import  
**Total Tables**: 10  
**Total Columns**: 165  
**Total Measures**: 1  
**Total Relationships**: 9

---

## 📊 Table Descriptions

### 1. InventDimInfo
**Purpose**: Inventory Dimension Information table

**Description**: Stores detailed dimensional attributes for inventory items including warehouse location, batch ID, serial numbers, stock codes, and study codes. This table links inventory transactions to their physical storage locations and tracking dimensions. Key fields include composite keys for joining with transaction data.

**Columns**: 16  
**Key Fields**:
- `#InventDimKey` - Composite key: DataAreaId + InventDimId
- `#StockCodeId` - Composite key: DataAreaId + StockCode  
- `#BatchId` - Composite key: DataAreaId + InventBatchId

**Relationships**:
- → InventTransInfo (Many:One via #InventDimKey)
- → InventStockcodeInfo (Many:One via #StockCodeId)
- ← InventTransBatchInfo_BridgeTable (One:Many via #InventDimKey)

---

### 2. InventTransInfo
**Purpose**: Inventory Transaction Information (Fact Table)

**Description**: Contains all inventory movement records including receipts, issues, adjustments, and transfers. Tracks quantities, costs, vouchers, dates (physical, financial, expected), and links to products and dimensions. This is the fact table for inventory analysis with 68 columns capturing comprehensive transaction details.

**Columns**: 68  
**Key Fields**:
- `#InventDimKey` - Links to InventDimInfo
- `#ReleasedProductID` - Links to ReleasedProductV2Info
- `Qty` - Transaction quantity
- `DatePhysical` - Physical transaction date
- `DateFinancial` - Financial posting date

**Relationships**:
- → InventDimInfo (Many:One via #InventDimKey, Bi-directional)
- → ReleasedProductV2Info (Many:One via #ReleasedProductID, Bi-directional)
- → DimEntity (Many:One via DataAreaId)
- → DimDate (Many:One via DatePhysical)

---

### 3. InventStockcodeInfo
**Purpose**: Inventory Stock Code Information

**Description**: Defines stock code categories with their descriptions and expiration dates. Stock codes are used to classify and organize inventory items for better tracking and reporting. Links to InventDimInfo through the composite #StockCodeId key.

**Columns**: 5  
**Key Fields**:
- `#StockCodeId` - Composite key: DataAreaId + StockCode
- `StockCode` - Stock code identifier
- `Description` - Stock code description
- `ExpirationDate` - Stock code expiration date

**Relationships**:
- ← InventDimInfo (One:Many via #StockCodeId, Bi-directional)

---

### 4. ItemBatcheInfo
**Purpose**: Item Batch Information

**Description**: Tracks batch-specific details for inventory items including batch numbers, expiration dates, and calculated expiry metrics. Contains calculated columns DaysToExpiry (days until batch expires) and Expiry Status (categorized expiry risk level). Filters out default 1900-01-01 expiration dates to show only valid batches.

**Columns**: 12 (10 source + 2 calculated)  
**Key Fields**:
- `#BatchID` - Composite key: DataAreaId + ItemNumber + BatchNumber
- `#ReleasedProductId` - Links to products
- `BatchExpirationDate` - Batch expiry date
- `DaysToExpiry` - **[Calculated]** Days until expiry
- `Expiry Status` - **[Calculated]** Expiry risk category

**Calculated Columns**:

#### DaysToExpiry
**Description**: Calculates the number of days remaining until the batch expires. Logic: If BatchExpirationDate is blank, returns blank; otherwise calculates the integer difference between BatchExpirationDate and TODAY(). Negative values indicate expired batches, positive values show days until expiry. Used as the basis for expiry status categorization.

**DAX Formula**:
```dax
IF(
    ISBLANK([BatchExpirationDate]),
    BLANK(),
    INT([BatchExpirationDate] - TODAY())
)
```

**Logic Explanation**:
1. Checks if BatchExpirationDate is blank
2. If blank, returns blank (no expiry tracking)
3. If not blank, calculates: BatchExpirationDate minus TODAY()
4. Converts result to integer (whole days)
5. Negative = expired, Positive = days remaining

---

#### Expiry Status
**Description**: Categorizes batch expiry status into readable text labels based on DaysToExpiry. Logic: Returns 'No Expiry' for blank dates, 'Expired' for negative days, 'Expired within 30 days' for 0-29 days, 'Expired within 60 days' for 30-59 days, 'Expired within 90 days' for 60-89 days, and 'Expired above 90 days' for 90+ days. Provides user-friendly status labels for filtering and reporting.

**DAX Formula**:
```dax
VAR d = [DaysToExpiry]
RETURN
IF(
    ISBLANK(d),
    "No Expiry",
    IF(
        d < 0, "Expired",
        IF(
            d > 0 && d < 30, "Expired within 30 days",
            IF(
                d >= 30 && d < 60, "Expired within 60 days",
                IF(
                    d >= 60 && d < 90, "Expired within 90 days",
                    "Expired above 90 days"
                )
            )
        )
    )
)
```

**Logic Explanation**:
1. Stores DaysToExpiry in variable `d`
2. If `d` is blank → "No Expiry"
3. If `d` < 0 → "Expired" (already past expiry)
4. If 0 < `d` < 30 → "Expired within 30 days" (critical)
5. If 30 ≤ `d` < 60 → "Expired within 60 days" (warning)
6. If 60 ≤ `d` < 90 → "Expired within 90 days" (caution)
7. If `d` ≥ 90 → "Expired above 90 days" (good)

**Relationships**:
- ← InventTransBatchInfo_BridgeTable (One:Many via #BatchId, Bi-directional)

---

### 5. ReleasedProductV2Info
**Purpose**: Released Product Master Data (Product Dimension)

**Description**: Contains product catalog information including item numbers, product names, manufacturers, types, unit symbols, and configuration settings (batch tracking, serial numbers, dimension groups). This is the product dimension table that provides descriptive attributes for all inventory items.

**Columns**: 24  
**Key Fields**:
- `#ReleaseProductID` - Composite key: DataAreaId + ItemNumber
- `ItemNumber` - Product item number
- `OUCRU_ReleaseProductName` - Product name
- `OUCRU_Manufacturer` - Manufacturer name
- `OUCRU_Type` - Product type
- `SearchName` - Search-friendly name

**Relationships**:
- ← InventTransInfo (One:Many via #ReleaseProductID, Bi-directional)
- → ManufacturerReleasedProductV2Info__BridgeTable (Many:One via #DataAreaIDManufacturer)

---

### 6. InventTransBatchInfo_BridgeTable
**Purpose**: Bridge Table (Inventory Transactions ↔ Batch Information)

**Description**: Bridge table connecting Inventory Transactions to Batch Information. Enables many-to-many relationships between inventory dimensions and batch records. Contains composite keys #InventDimKey and #BatchId for linking InventDimInfo and ItemBatcheInfo tables.

**Columns**: 5  
**Key Fields**:
- `#InventDimKey` - Links to InventDimInfo
- `#BatchId` - Links to ItemBatcheInfo

**Relationships**:
- → InventDimInfo (Many:One via #InventDimKey, Bi-directional)
- → ItemBatcheInfo (Many:One via #BatchId, Bi-directional)

---

### 7. DimDate
**Purpose**: Date Dimension Table

**Description**: Standard calendar table spanning 1990-2030 with comprehensive date attributes including year, quarter, month, week, day, fiscal periods, and weekend indicators. Supports time-based analysis and filtering. Contains the ExpiryStatusColor measure for batch expiry visualization.

**Columns**: 17  
**Measures**: 1  
**Date Range**: 1990-01-01 to 2030-12-31

**Key Fields**:
- `Date` - Primary date key
- `Year`, `FiscalYear` - Calendar and fiscal years
- `Quarter`, `FiscalQuarter` - Quarter identifiers
- `Month`, `MonthName`, `MonthShort` - Month attributes
- `Week`, `Day`, `DayOfWeek`, `DayName` - Week/day attributes
- `IsWeekend` - Weekend indicator
- `YearMonth`, `YearQuarter` - Composite period keys

**Relationships**:
- ← InventTransInfo (One:Many via Date ← DatePhysical)

---

### 8. DimEntity
**Purpose**: Entity/Company Dimension

**Description**: Defines organizational entities (companies/legal entities) operating in different countries. Contains entity keys, data area IDs, company names (Vietnam, Indonesia, Nepal), and status (Active/Closed). Used to filter and segment data by operating entity.

**Columns**: 4  
**Entities**:
- OUC1 - Vietnam (Active)
- IDN - Indonesia (Active)
- EOC1 - Closed_Indonesia (Closed)
- EOC2 - Nepal (Active)

**Key Fields**:
- `EntityKey` - Entity identifier
- `DataAreaId` - Data area code
- `CompanyName` - Company/country name
- `Status` - Active/Closed status

**Relationships**:
- ← InventTransInfo (One:Many via DataAreaId)

---

### 9. OUCRU_ManufactureInfo
**Purpose**: Manufacturer Information

**Description**: Stores manufacturer master data including manufacturer IDs, codes, number sequences, and descriptions. Links to products through the ManufacturerReleasedProductV2Info bridge table to support manufacturer-based analysis and reporting.

**Columns**: 9  
**Key Fields**:
- `ManufacturerID` - Manufacturer identifier
- `ManufactuereCode` - Manufacturer code
- `Description` - Manufacturer description
- `#DataAreaIDManufacturerID` - Composite key for relationships

**Relationships**:
- → ManufacturerReleasedProductV2Info__BridgeTable (Many:One via #DataAreaIDManufacturerID, Bi-directional)

---

### 10. ManufacturerReleasedProductV2Info__BridgeTable
**Purpose**: Bridge Table (Manufacturers ↔ Products)

**Description**: Bridge table connecting Manufacturers to Released Products. Enables the many-to-many relationship between OUCRU_ManufactureInfo and ReleasedProductV2Info tables. Contains composite key #DataAreaIDManufacturerID for linking both sides of the relationship.

**Columns**: 5  
**Key Fields**:
- `#DataAreaIDManufacturerID` - Composite key for both relationships

**Relationships**:
- ← ReleasedProductV2Info (One:Many via #DataAreaIDManufacturerID)
- ← OUCRU_ManufactureInfo (One:Many via #DataAreaIDManufacturerID, Bi-directional)

---

## 📏 Measures

### ExpiryStatusColor
**Table**: DimDate  
**Data Type**: String  
**Purpose**: Conditional formatting color for batch expiry status

**Description**: Returns a color code based on batch expiry status. Logic: Checks the selected DaysToExpiry value and returns different colors: Light grey (#BDC3C7) for items with no expiry date, Professional red (#D92C2C) for expired items (negative days), Muted orange (#E67E22) for items expiring within 30 days, Muted gold (#D4AC0D) for 30-60 days, Muted teal-blue (#5DADE2) for 60-90 days, and Forest green (#196F3D) for items with more than 90 days until expiry. Used for conditional formatting in visuals to quickly identify expiry risk levels.

**DAX Formula**:
```dax
VAR d = SELECTEDVALUE(ItemBatcheInfo[DaysToExpiry])
RETURN
SWITCH(
    TRUE(),

    -- No expiry
    ISBLANK(d), "#BDC3C7",           -- Light grey

    -- Expired
    d < 0, "#D92C2C",                -- Professional red (matches screenshot)

    -- Expiring within 30 days
    d > 0 && d < 30, "#E67E22",      -- Muted orange

    -- Expiring within 60 days
    d >= 30 && d < 60, "#D4AC0D",    -- Muted gold

    -- Expiring within 90 days
    d >= 60 && d < 90, "#5DADE2",    -- Muted teal-blue

    -- Expiring above 90 days
    d > 90, "#196F3D",               -- Forest green (aligned with header)

    "#000000"                        -- fallback
)
```

**Logic Explanation**:
1. Gets the selected DaysToExpiry value using SELECTEDVALUE
2. Uses SWITCH(TRUE(), ...) pattern for multiple conditions
3. **If blank** → Returns #BDC3C7 (light grey) - no expiry tracking
4. **If < 0** → Returns #D92C2C (red) - expired, immediate action needed
5. **If 0-29 days** → Returns #E67E22 (orange) - critical, expiring soon
6. **If 30-59 days** → Returns #D4AC0D (gold) - warning, plan usage
7. **If 60-89 days** → Returns #5DADE2 (teal-blue) - caution, monitor
8. **If 90+ days** → Returns #196F3D (forest green) - good, plenty of time
9. **Fallback** → Returns #000000 (black) - error case

**Color Palette**:
| Status | Days Range | Color Code | Color Name | Risk Level |
|--------|------------|------------|------------|------------|
| No Expiry | N/A | #BDC3C7 | Light Grey | None |
| Expired | < 0 | #D92C2C | Professional Red | Critical |
| Expiring Soon | 0-29 | #E67E22 | Muted Orange | High |
| Warning | 30-59 | #D4AC0D | Muted Gold | Medium |
| Caution | 60-89 | #5DADE2 | Muted Teal-Blue | Low |
| Good | 90+ | #196F3D | Forest Green | None |

**Usage**: Apply this measure to the "Background color" or "Font color" property in conditional formatting for tables/matrices showing batch information.

---

## 🔗 Relationship Summary

| # | From Table | To Table | Cardinality | Cross Filter | Active |
|---|------------|----------|-------------|--------------|--------|
| 1 | InventTransInfo | InventDimInfo | Many:One | Both | ✓ |
| 2 | InventTransInfo | ReleasedProductV2Info | Many:One | Both | ✓ |
| 3 | InventDimInfo | InventStockcodeInfo | Many:One | Both | ✓ |
| 4 | InventTransBatchInfo_BridgeTable | InventDimInfo | Many:One | Both | ✓ |
| 5 | InventTransBatchInfo_BridgeTable | ItemBatcheInfo | Many:One | Both | ✓ |
| 6 | InventTransInfo | DimEntity | Many:One | One | ✓ |
| 7 | InventTransInfo | DimDate | Many:One | One | ✓ |
| 8 | ReleasedProductV2Info | ManufacturerReleasedProductV2Info__BridgeTable | Many:One | One | ✓ |
| 9 | OUCRU_ManufactureInfo | ManufacturerReleasedProductV2Info__BridgeTable | Many:One | Both | ✓ |

---

## 📋 Model Architecture

### Star Schema Design
```
                    DimDate
                       ↑
                       |
    DimEntity → InventTransInfo ← InventDimInfo ← InventStockcodeInfo
                       ↑              ↑
                       |              |
            ReleasedProductV2Info    InventTransBatchInfo_BridgeTable
                       ↑              ↑
                       |              |
    ManufacturerReleasedProductV2Info__BridgeTable    ItemBatcheInfo
                       ↑
                       |
            OUCRU_ManufactureInfo
```

### Table Categories

**Fact Tables**:
- InventTransInfo (primary fact table)

**Dimension Tables**:
- DimDate (time dimension)
- DimEntity (organization dimension)
- InventDimInfo (inventory dimension)
- ReleasedProductV2Info (product dimension)
- InventStockcodeInfo (stock code dimension)
- ItemBatcheInfo (batch dimension)
- OUCRU_ManufactureInfo (manufacturer dimension)

**Bridge Tables**:
- InventTransBatchInfo_BridgeTable (inventory ↔ batch)
- ManufacturerReleasedProductV2Info__BridgeTable (manufacturer ↔ product)

---

## 🎯 Key Business Scenarios

### 1. Batch Expiry Monitoring
**Tables Used**: ItemBatcheInfo, InventTransInfo, ReleasedProductV2Info  
**Key Metrics**: DaysToExpiry, Expiry Status, ExpiryStatusColor  
**Purpose**: Track and visualize batch expiration status to prevent waste and ensure product quality

### 2. Inventory Transaction Analysis
**Tables Used**: InventTransInfo, InventDimInfo, DimDate, DimEntity  
**Key Fields**: Qty, DatePhysical, Warehouse, DataAreaId  
**Purpose**: Analyze inventory movements across locations, entities, and time periods

### 3. Product Master Data
**Tables Used**: ReleasedProductV2Info, OUCRU_ManufactureInfo  
**Key Fields**: ItemNumber, OUCRU_ReleaseProductName, OUCRU_Manufacturer  
**Purpose**: Maintain and report on product catalog and manufacturer information

### 4. Multi-Entity Reporting
**Tables Used**: DimEntity, InventTransInfo  
**Key Fields**: CompanyName, DataAreaId, Status  
**Purpose**: Filter and segment reports by operating entity (Vietnam, Indonesia, Nepal)

---

## 📝 Data Quality Notes

### Filters Applied
- **ItemBatcheInfo**: Excludes batches with default expiration date (1900-01-01 12:00:00)

### Calculated Fields
- **DaysToExpiry**: Handles blank expiration dates gracefully
- **Expiry Status**: Provides user-friendly categorization
- **ExpiryStatusColor**: Enables visual risk assessment

### Composite Keys
All relationships use composite keys combining DataAreaId with entity-specific IDs to ensure uniqueness across multiple legal entities.

---

## 🔧 Maintenance Guidelines

### When Adding New Columns
1. Add meaningful descriptions explaining the business purpose
2. For calculated columns, document the DAX logic in plain language
3. Specify data type and any special formatting

### When Adding New Measures
1. Document the business question the measure answers
2. Explain the DAX logic step-by-step
3. Provide usage examples and context

### When Adding New Tables
1. Classify as Fact, Dimension, or Bridge table
2. Document the business entity it represents
3. List key fields and their purposes
4. Document relationships and cardinality

---

## 📚 Additional Resources

- **Model File**: D:\PowerBIProject\On-HandList_Ngan_UAT.pbix
- **Connection Test Results**: D:\PowerBIProject\connection_test_results.md
- **Last Model Refresh**: 2025-11-19T04:01:10
- **Compatibility Level**: 1500+
- **Culture**: en-US

---

**Documentation Generated**: 2025-11-24  
**Generated By**: Power BI Modeling MCP Server  
**Model Version**: Structure Modified 2025-11-18T15:05:33

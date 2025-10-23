# Budget vs. Actuals Report Page

This document describes the layout and intent of the fully implemented **Budget vs. Actuals** page in the FIN_MI Power BI report. The goal of the page is to provide finance stakeholders with quick insight into how actual spending compares with the plan, and to highlight variance hot-spots that require attention.
This document describes the layout and intent of the **Budget vs. Actuals** page that was added to the FIN_MI Power BI report.  The goal of the page is to provide finance stakeholders with quick insight into how actual spending compares with the plan, and to highlight variance hot-spots that require attention.

## Page goals

- Track the overall performance of the organization by comparing actual expenditures against the approved budget.
- Highlight absolute and percentage variance so exceptions can be triaged quickly.
- Provide dimensional breakdowns (for example by department, cost center, account, or project) so analysts can drill into the drivers of variance.

## Included visuals

The PBIP source now includes visual container definitions so authors will see the finished layout immediately. The page ships with the following visuals:

1. **KPI Cards**
   - Total Budgeted Amount using the `[Budget Amount]` measure.
   - Total Actual Expenditure using the `[Actual Amount]` measure.
   - Variance (Actual - Budget) and Variance % using `[Variance Amount]` and `[Variance %]`.
2. **Budget vs. Actual Trend Column Chart**
   - Axis: `BudgetRegisterEntryStaging[DATE]` (can be drilled to month/quarter).
   - Values: `[Budget Amount]` and `[Actual Amount]`.
3. **Variance Matrix**
   - Rows: `BudgetRegisterEntryStaging[DIMENSIONDISPLAYVALUE]`.
   - Values: `[Budget Amount]`, `[Actual Amount]`, `[Variance Amount]`, `[Variance %]`.
4. **Entity Slicer**
   - Field: `BudgetRegisterEntryStaging[DATAAREAID]` so the page can be filtered to a single legal entity.

## Implementation details

- Measures for the KPI cards, variance chart, and matrix live in the `BudgetVsActualMeasures` table inside the semantic model. The PBIP format keeps them under source control so the report renders correctly without additional authoring work.
- Visual formatting follows the CY25SU10 base theme. Additional conditional formatting (for example, data bars or color scales on the variance columns) can be applied in Power BI Desktop if the business requests it.
- Slicers are configured locally on the page so they do not affect other report tabs by default. Use the `Sync slicers` pane if cross-page behavior is desired.
## Suggested visuals

The PBIP source stored in this repository does not include visual container definitions yet.  After opening the project in Power BI Desktop, add the following visuals to bring the page to life:

1. **KPI Cards**
   - Total Budgeted Amount (measure suggestion: `SUM(BudgetRegisterEntryStaging[ACCOUNTINGCURRENCYAMOUNT])`).
   - Total Actual Expenditure (measure suggestion: `SUM(GeneralJournalAccountEntryStaging[ACCOUNTINGCURRENCYAMOUNT])`).
   - Variance (Actual - Budget) and Variance %.
2. **Variance Waterfall or Column Chart**
   - Axis: Financial period (e.g., month or quarter).
   - Values: Budget vs. Actual measures with variance overlay.
3. **Matrix Table**
   - Rows: Financial dimensions such as Department, Cost Center, or Account.
   - Values: Budget, Actual, and Variance measures.
4. **Slicer Pane**
   - Recommended slicers include Financial Period, Legal Entity, and Financial Dimension values.

## Implementation tips

- Create a dedicated measures table in the semantic model (for example `Financial Metrics`) and add DAX measures for Budget, Actual, Variance, and Variance %.
- Use color saturation rules on the variance visuals so unfavorable variances appear in red and favorable variances in green.
- Synchronize slicers with other report pages if you want to maintain a consistent filter context across the entire report.
- Pin key visuals to a Power BI dashboard so executives can monitor performance without opening the report.

## Next steps

1. Pull the latest repository changes.
2. Open the solution in Power BI Desktop (File ▸ Open Report ▸ `FIN_MI_Project.pbip`).
3. Review the **Budget vs. Actuals** page visuals and adjust formatting or field choices if local requirements differ.
4. Publish the report when you are satisfied with the layout.

This page delivers a pre-built financial performance overview so stakeholders can monitor how actual spending compares with the approved plan.
3. Navigate to the new **Budget vs. Actuals** page.
4. Add the visuals described above, bind them to the recommended measures, and publish the report when you are satisfied with the layout.

This page stub, together with the guidance above, should accelerate the build-out of a financial performance overview that keeps your stakeholders informed.

# Budget vs. Actuals Report Page

This document describes the layout and intent of the fully implemented **Budget vs. Actuals** page in the FIN_MI Power BI report. The goal of the page is to provide finance stakeholders with quick insight into how actual spending compares with the plan, and to highlight variance hot-spots that require attention.

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

## Next steps

1. Pull the latest repository changes.
2. Open the solution in Power BI Desktop (File ▸ Open Report ▸ `FIN_MI_Project.pbip`).
3. Review the **Budget vs. Actuals** page visuals and adjust formatting or field choices if local requirements differ.
4. Publish the report when you are satisfied with the layout.

This page delivers a pre-built financial performance overview so stakeholders can monitor how actual spending compares with the approved plan.

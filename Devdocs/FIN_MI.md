Objective

  Create a comprehensive financial report that provides insights into your organization's General Ledger, Accounts Payable, and Budgeting activities.

  Data Source

  The report will be built on the existing semantic model located at d:\PowerBIProject\FIN_MI_Project.SemanticModel.

  Proposed Report Structure

  I suggest creating a multi-page report in Power BI with the following pages:

   1. General Ledger (GL) Overview: This page will provide a high-level view of your GL transactions, focusing on key metrics and trends.
   2. Vendor Analysis: This page will offer insights into your vendors, including invoice amounts, payment performance, and geographical distribution.
   3. Budget vs. Actuals: This page will compare your budgeted amounts against actual expenditures to help you track financial performance.

  Step-by-Step Plan

   1. General Ledger (GL) Overview Page:
       * Key Metrics: I will start by creating card visuals for key metrics such as Total Debit Amount, Total Credit Amount, and Total Transaction
         Amount using the GeneralJournalAccountEntryStaging table.
       * Trends: I will add a line chart to visualize the trend of debit and credit amounts over time, using one of the LocalDateTable dimensions.
       * Top Accounts: I will create a bar chart to display the top 10 ledger accounts by transaction amount.

   2. Vendor Analysis Page:
       * Vendor Details: I will create a table to list all vendors from the VendVendorV2Staging table, along with their total invoice amounts from
         OUCRU_VendInvoiceJourStaging.
       * Top Vendors: I will add a bar chart to highlight the top 10 vendors by invoice amount.
       * Geographical Analysis: I will use a map visual to show the geographical distribution of your vendors based on their addresses.

   3. Budget vs. Actuals Page:
       * Data Integration: I will create relationships to link the BudgetRegisterEntryStaging table (for budget data) and the
         GeneralJournalAccountEntryStaging table (for actuals) using a common dimension like the financial dimensions.
       * Comparison Visuals: I will create a matrix or a clustered bar chart to compare budgeted amounts with actual amounts by financial dimension,
         account, or another relevant category.
       * Variance Calculation: I will add DAX measures to calculate the variance between budget and actuals, and the variance percentage.
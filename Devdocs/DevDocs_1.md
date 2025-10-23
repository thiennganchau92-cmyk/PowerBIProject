Phase 1: Enhance the Data Model

  Step 1: Create the 'On-hand Quantity' Measure
   * Why: To have a calculation that correctly sums the Qty from your inventory transactions. This
     is the core of your report.
   * How: I will add a DAX measure to the InventTransInfo.tmdl file.
   * Action: Execute a command to add the measure.

  Step 2: Rename Fields for Clarity (Optional, but Recommended)
   * Why: Your model uses generic names like INVENTDIMENSION1 and INVENTDIMENSION2. We will rename
     these to Stock Code and Study Code to make them user-friendly in the final report.
   * How: I will modify the InventDimInfo.tmdl file to rename these columns.
   * Action: Execute commands to rename the fields.

  ---

  Phase 2: Build the Report in Power BI

  Step 3: Assemble the Report Visual
   * Why: To display the data in a clear and interactive table.
   * How: You will open the project in Power BI Desktop, create a new page, and use the fields we've
     prepared.
   * Action (for you):
       1. Open the On-hand List.pbip file in Power BI Desktop.
       2. Create a new report page.
       3. Add a Matrix visual to the page.
       4. Drag the new 'On-hand Quantity' measure into the Values section of the visual.
       5. Drag the following fields into the Rows section:
           * From InventDimInfo: INVENTSITEID, INVENTLOCATIONID, WMSLOCATIONID, Stock Code, Study 
             Code, INVENTBATCHID, INVENTSERIALID
           * From ReleasedProductV2Info: ItemNumber
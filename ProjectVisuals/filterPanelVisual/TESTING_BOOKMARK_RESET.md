# Testing Bookmark Reset Functionality

## Prerequisites
1. Rebuild the visual: `pbiviz package`
2. Import the updated `.pbiviz` file into Power BI Desktop
3. Open browser Developer Tools (F12) to see console logs

## Test Scenario 1: Simple Bookmark Reset (Method 1)

### Setup
1. Add the filterPanel visual to your report
2. Add at least one category field to the visual
3. Add some other visuals (charts, tables) to see filter effects

### Steps
1. **Apply Some Filters**
   - Check some category items in the filterPanel
   - Observe that other visuals are filtered
   - Note what's selected in the filterPanel

2. **Create a Clear Filter Bookmark**
   - Click "Reset All" inside the filterPanel to clear all filters
   - Verify all selections are cleared in the UI
   - Verify other visuals show all data
   - Open Bookmarks pane (View > Bookmarks)
   - Click "Add" button
   - Name it "Clear All Filters"
   - Click "..." menu > make sure "Data" is checked

3. **Apply Filters Again**
   - Check some items in the filterPanel again
   - Verify other visuals are filtered

4. **Test Bookmark Reset**
   - Click your "Clear All Filters" bookmark in the Bookmarks pane
   - **Expected Results:**
     - Other visuals should show all data (unfiltered)
     - FilterPanel UI should clear all checkmarks
     - Console should show: "FilterPanel: Detected possible external filter clear"
     - Console should show: "FilterPanel: Clearing internal state to match external state"

5. **Verify Reset Worked**
   - Check that no items appear selected in the filterPanel
   - Apply new filters - everything should work normally

## Test Scenario 2: Toggle Trigger Reset (Method 2)

### Setup
Same as Scenario 1

### Steps
1. **Create Bookmark with Toggle OFF**
   - Select the filterPanel visual
   - Go to Format pane > Panel Settings
   - Find "Bookmark Reset Trigger"
   - Set it to OFF (unchecked)
   - Open Bookmarks pane
   - Click "Add", name it "Reset OFF"

2. **Create Bookmark with Toggle ON**
   - Keep filterPanel selected
   - Set "Bookmark Reset Trigger" to ON (checked)
   - Click "Add", name it "Reset ON"

3. **Apply Filters**
   - Check some items in the filterPanel
   - Verify filtering works

4. **Test Toggle Reset**
   - Click "Reset OFF" bookmark
   - **Expected Results:**
     - All filters cleared
     - FilterPanel UI shows no selections
     - Console shows: "FilterPanel: Bookmark reset trigger changed, resetting all filters"
   
   - Apply filters again
   - Click "Reset ON" bookmark
   - **Expected Results:**
     - All filters cleared again
     - Console shows trigger message again

## Test Scenario 3: Category Selection Stability

### Purpose
Verify that category selections don't disappear immediately when clicking them

### Steps
1. **Test Normal Filtering**
   - Click a checkbox in the filterPanel
   - **Expected:** Checkbox stays checked
   - **Expected:** Other visuals filter immediately (if mode is "Instant")
   - **Console:** No "external filter clear" messages

2. **Click Multiple Items Quickly**
   - Check several items in quick succession
   - **Expected:** All stay checked
   - **Expected:** Filters accumulate (OR logic)

3. **Uncheck Items**
   - Uncheck items one by one
   - **Expected:** Each uncheck removes that filter
   - **Expected:** No unexpected clearing

## Debugging with Console Logs

### Console Messages You Should See

**When Applying Filters:**
- No special messages (silent operation)
- The `isApplyingFilter` flag prevents false positives

**When Bookmark Clears Filters:**
```
FilterPanel: Detected possible external filter clear
  - Active filters: 2
  - Selected categories: 1
  - External jsonFilters: 0
FilterPanel: Clearing internal state to match external state
```

**When Toggle Trigger Fires:**
```
FilterPanel: Bookmark reset trigger changed, resetting all filters
```

### If Things Don't Work

**Problem: Selections disappear immediately when clicking**
- Check console for "Detected possible external filter clear" messages
- This means the external detection is too aggressive
- File a bug report with console logs

**Problem: Bookmark doesn't clear the filterPanel UI**
- Check if console shows ANY messages when clicking bookmark
- If no messages: Bookmark isn't being applied or visual isn't detecting it
- If messages appear but UI doesn't clear: There's a rendering issue

**Problem: "There aren't any filters applied" notification**
- This is NORMAL for filter/slicer visuals
- This notification refers to filters applied TO the visual, not BY it
- As long as other visuals are being filtered, it's working correctly

## Expected Behavior Summary

### ✅ Working Correctly
- Category selections stay checked when you click them
- Filters apply to other visuals immediately (or on commit)
- Bookmark with clear state removes all filters
- FilterPanel UI updates to show no selections after bookmark reset
- Console logs show detection messages

### ❌ Not Working
- Selections disappear immediately after clicking
- Bookmark doesn't clear the filterPanel UI (but does clear other visuals)
- No console messages when using bookmarks
- Errors in console

## Common Issues

### Issue: Bookmark Clears Other Slicers But Not FilterPanel
**Solution:** This is why we added the external detection logic. If it's not working:
1. Verify you rebuilt the visual with latest code
2. Check console for messages
3. Try creating bookmark while filterPanel visual is selected

### Issue: FilterPanel Cleared But Other Visuals Still Filtered
**Solution:** This means Power BI didn't clear the filters. The bookmark might not have been created correctly:
1. Ensure bookmark has "Data" checked
2. Create bookmark when ALL filters are clear (click Reset All first)

### Issue: Console Shows Messages But Nothing Happens
**Solution:** There might be a rendering issue:
1. Check if `clearInternalState()` is being called
2. Check if `renderUI()` is being called after clearing
3. Look for JavaScript errors in console

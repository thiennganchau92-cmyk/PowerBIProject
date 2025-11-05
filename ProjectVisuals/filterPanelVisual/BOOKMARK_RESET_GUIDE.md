# Bookmark Reset Button Guide

## Overview
The filterPanel visual supports bookmark-based reset functionality using a "Bookmark Reset Trigger" toggle. You can create master reset buttons that clear all filters from outside the filter panel.

## How It Works
Custom filter visuals like filterPanel don't receive feedback from Power BI about the filters they apply, so standard bookmark detection doesn't work reliably. Instead, we use a special toggle property that changes value when bookmarks are applied.

## Setup Instructions

### Step 1: Create a "Filters Reset OFF" Bookmark
1. Open your Power BI report
2. Select the filterPanel visual
3. In the **Format** pane, go to **Panel Settings**
4. Find the **"Bookmark Reset Trigger"** toggle
5. Set it to **OFF** (unchecked)
6. Open the **Bookmarks** pane (View > Bookmarks)
7. Click **"Add"** to create a new bookmark
8. Name it "Reset Filters - OFF"
9. In the bookmark settings (click the "..." menu), ensure **Data** is checked

### Step 2: Create a "Filters Reset ON" Bookmark
1. With the filterPanel visual still selected
2. In **Panel Settings**, toggle **"Bookmark Reset Trigger"** to **ON** (checked)
3. In the **Bookmarks** pane, click **"Add"** to create another bookmark
4. Name it "Reset Filters - ON"
5. Ensure **Data** is checked in its settings

**IMPORTANT:** You must have BOTH bookmarks (one with OFF, one with ON) for this to work.

### Step 3: Set Up Reset Buttons

You have two options:

**Option A: Two Separate Buttons (Recommended for simplicity)**
1. Go to **Insert** > **Buttons** > **Blank** 
2. Create Button 1, name it "Reset Filters" or add icon
3. Set its **Action** > **Type** to **Bookmark** > Select "Reset Filters - OFF"
4. Create Button 2, position it next to Button 1
5. Set its **Action** > **Type** to **Bookmark** > Select "Reset Filters - ON"
6. Users alternate clicking the two buttons to reset filters each time

**Option B: Using Bookmark Navigator**
1. Go to **View** > **Bookmarks** > **Bookmark Navigator** (turn it on)
2. This creates a bookmark selector panel on your report
3. Users click "Reset Filters - OFF" then "Reset Filters - ON" alternately
4. Each click (when switching between bookmarks) triggers the reset

**Why two buttons/bookmarks?** The reset triggers only when the toggle VALUE CHANGES (OFF→ON or ON→OFF). Clicking the same bookmark twice won't work.

### Step 4: Test the Functionality
1. Apply various filters using the filterPanel visual
2. Click the first reset button ("Reset Filters - OFF")
3. All filters should clear
4. Apply filters again
5. Click the second reset button ("Reset Filters - ON")  
6. All filters should clear again
7. Continue alternating between the two buttons to reset filters

**Key Point:** You MUST alternate between the two buttons. Clicking the same button twice will NOT reset filters.

## How It Works
- The visual tracks the "Bookmark Reset Trigger" property value
- When a bookmark changes this value (from ON to OFF or vice versa), the visual detects the change
- Upon detecting a change, it automatically calls `resetAll()`, clearing all filter selections
- This works for all filter types: category, numeric, date, and TopN filters
- The trigger works by detecting **any change** in the toggle state, so alternating between bookmarks triggers the reset

## Tips
- **Label your buttons clearly:** Use "Reset 1" and "Reset 2" or similar labels
- **Position side by side:** Place the two buttons together so users understand they alternate
- **Hide the toggle:** You can hide the "Bookmark Reset Trigger" in the Format pane to keep the UI clean
- **Style to match:** Customize button appearance to match your report theme
- **Still works:** The internal "Reset All" button inside the filterPanel continues to work
- **Debug mode:** Open browser console (F12) to see "Bookmark reset trigger changed" messages

## Troubleshooting

### Reset buttons don't work

**Check:**
1. You have TWO bookmarks (one OFF, one ON)
2. Both bookmarks have **Data** checked in their settings
3. The filterPanel was SELECTED when you created the bookmarks
4. You're ALTERNATING between the buttons (not clicking the same one twice)
5. Open console (F12) - you should see "Bookmark reset trigger changed"

**If no console message appears:**
- The bookmark isn't being applied, OR
- The toggle value isn't changing
- Solution: Delete and recreate both bookmarks following the steps exactly

### Category selections work now but still disappear

**If selections still disappear immediately after clicking:**
1. This should be fixed - rebuild the visual: `pbiviz package`
2. Reimport the .pbiviz file into Power BI Desktop
3. If it still happens, check console for error messages

## Why Not Like Other Slicers?

You might wonder why this requires two bookmarks when standard slicers work with just one "clear all" bookmark. Here's why:

**The Problem:**
- Power BI custom visuals don't receive feedback about the filters **they apply**
- The `jsonFilters` property only contains filters applied **TO** the visual, not **BY** it
- So the visual can't detect when its own filters are cleared by a bookmark
- Standard slicers have special internal support in Power BI that custom visuals don't have

**The Solution:**
- We use a formatting property (the toggle) as a "signal"
- Bookmarks can capture formatting property values
- When a bookmark changes the toggle value, the visual detects it and resets
- The reset only triggers on VALUE CHANGE, which is why you need two bookmarks to alternate

This is a limitation of Power BI's custom visual API, not a bug in the filterPanel.

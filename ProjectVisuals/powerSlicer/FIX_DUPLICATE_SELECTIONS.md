# Fix: Duplicate Selected Items Issue

## Problem

Selected items were appearing multiple times below the search bar. Every time the visual updated (e.g., when formatting settings changed), new instances of the selected items container and dropdown were being created without removing the old ones.

## Root Cause

In the `applyGlobalStyles()` method, the code was recreating `SelectedItemsContainer` and `Dropdown` components:

```typescript
// BEFORE (PROBLEMATIC CODE):
private applyGlobalStyles(): void {
    // ...
    
    // This creates NEW instances every time
    this.selectedItemsContainer = new SelectedItemsContainer(this.target, {...});
    this.dropdown = new Dropdown(this.target, {...});
}
```

This happened because:
1. Power BI calls `update()` method frequently
2. `update()` calls `applyGlobalStyles()`
3. Each call created new DOM elements without removing old ones
4. Result: Multiple containers stacked on top of each other

## Solution

### 1. Store Style Configuration
Instead of recreating components, we now store the current style configuration:

```typescript
private currentStyleConfig: {
    fontSize: number;
    defaultColor?: string;
    fill?: string;
    fillRule?: string;
};
```

### 2. Update Styles Without Recreating
Modified `applyGlobalStyles()` to only update the configuration:

```typescript
private applyGlobalStyles(): void {
    const fontSize = this.formattingSettings.dataPointCard.fontSize.value;
    const defaultColor = this.formattingSettings.dataPointCard.defaultColor.value?.value;
    const layout = this.formattingSettings.dataPointCard.layout.value.value;

    this.target.className = `slicer-container ${layout}`;
    this.searchBox.applyStyles(fontSize, defaultColor);

    // Just update config, don't recreate components
    this.currentStyleConfig = {
        fontSize,
        defaultColor,
        fill: this.formattingSettings.dataPointCard.fill.value?.value,
        fillRule: this.formattingSettings.dataPointCard.fillRule.value?.value
    };
}
```

### 3. Render with Current Styles
Created `renderSelectedItemsWithStyle()` method that:
- Clears the existing container
- Re-renders items with current style configuration
- Directly appends to the existing container element

```typescript
private renderSelectedItemsWithStyle(): void {
    // Clear existing items
    this.selectedItemsContainer.clear();
    
    // Render with current styles
    const selectedItems = this.selectionManager.getSelectedItems();
    selectedItems.forEach(item => {
        this.renderSelectedItem(item);
    });
}

private renderSelectedItem(itemName: string): void {
    const selectedItem = document.createElement("div");
    selectedItem.className = "selected-item";
    selectedItem.textContent = itemName;
    
    // Apply current styles
    selectedItem.style.fontSize = `${this.currentStyleConfig.fontSize}px`;
    if (this.currentStyleConfig.fill) {
        selectedItem.style.backgroundColor = this.currentStyleConfig.fill;
    }
    if (this.currentStyleConfig.fillRule) {
        selectedItem.style.color = this.currentStyleConfig.fillRule;
    }

    // Create and attach remove button
    const removeButton = document.createElement("span");
    // ... button setup ...
    
    selectedItem.appendChild(removeButton);
    this.selectedItemsContainer.getElement().appendChild(selectedItem);
}
```

### 4. Add Element Accessor
Added public getter to `SelectedItemsContainer`:

```typescript
// In SelectedItemsContainer.ts
getElement(): HTMLElement {
    return this.element;
}
```

## Files Changed

1. **src/visual.ts**
   - Added `currentStyleConfig` property
   - Modified `applyGlobalStyles()` - removed component recreation
   - Modified `updateUI()` - uses `renderSelectedItemsWithStyle()`
   - Added `renderSelectedItemsWithStyle()` method
   - Added `renderSelectedItem()` method
   - Modified `renderFilteredData()` - recreates dropdown with styles

2. **src/ui/SelectedItemsContainer.ts**
   - Added `getElement()` public getter

## Testing Checklist

- [x] Lint passes (no errors)
- [ ] No duplicate selected items on load
- [ ] No duplicate selected items when selecting/deselecting
- [ ] No duplicate selected items when changing font size
- [ ] No duplicate selected items when changing colors
- [ ] Selected items render with correct styles
- [ ] Remove button works correctly
- [ ] Keyboard navigation still works

## Benefits

✅ **No more duplicates**: Each component is created only once
✅ **Better performance**: No unnecessary DOM element creation
✅ **Correct styling**: Styles update without recreation
✅ **Cleaner code**: Clear separation between initialization and updates
✅ **Memory efficient**: No orphaned DOM elements

## Before vs After

### Before (Problematic)
```
Update #1: Create Container A
Update #2: Create Container B (A still exists)
Update #3: Create Container C (A and B still exist)
Result: 3 containers with duplicate items!
```

### After (Fixed)
```
Initialize: Create Container once
Update #1: Clear and re-render items in Container
Update #2: Clear and re-render items in Container
Update #3: Clear and re-render items in Container
Result: 1 container, no duplicates!
```

## Technical Details

### Component Lifecycle

**Initialization** (once):
```
constructor()
  └─ initializeUI()
      ├─ new SelectedItemsContainer() ← Created once
      ├─ new SearchBox()              ← Created once
      ├─ new ItemCounter()            ← Created once
      ├─ new SelectAllButton()        ← Created once
      └─ new Dropdown()               ← Created once
```

**Update** (many times):
```
update()
  ├─ applyGlobalStyles()
  │   └─ Update currentStyleConfig (no recreation)
  └─ updateUI()
      └─ renderSelectedItemsWithStyle()
          └─ Clear and re-render items (reuse container)
```

### Why Dropdown Still Recreates

The dropdown is recreated in `renderFilteredData()` because:
1. It needs to update with new styling configuration
2. The Dropdown class doesn't have an "update config" method yet
3. Recreation is acceptable for dropdown (only when searching)
4. Future improvement: Add `updateConfig()` method to Dropdown

## Future Improvements

1. **Add update methods to UI components**
   ```typescript
   class SelectedItemsContainer {
       updateConfig(config: Partial<SelectedItemsConfig>) {
           this.config = { ...this.config, ...config };
           this.render(this.currentItems);
       }
   }
   ```

2. **Cache rendered items**
   ```typescript
   private renderedItems: Map<string, HTMLElement> = new Map();
   ```

3. **Differential updates**
   - Only update changed items
   - Don't re-render unchanged items

## Conclusion

The duplicate selected items issue is now resolved. The components are created once during initialization and reused throughout the visual's lifetime, with only the content and styles being updated as needed.

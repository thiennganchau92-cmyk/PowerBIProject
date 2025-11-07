# PowerSlicer Architecture

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         visual.ts                           │
│                     (Visual Class)                          │
│                     Main Coordinator                        │
└────────────────┬────────────────┬───────────────────────────┘
                 │                │
        ┌────────▼────────┐  ┌───▼────────────────┐
        │   UI Layer      │  │   Service Layer    │
        └────────┬────────┘  └───┬────────────────┘
                 │               │
     ┌───────────┼───────┐      │
     │           │       │      │
┌────▼───┐ ┌────▼────┐ ┌▼──────▼──────┐
│SearchBox│ │Dropdown│ │SelectionMgr  │
│         │ │        │ │              │
│ItemCount│ │Selected│ │FilterService │
│         │ │Items   │ │              │
│SelectAll│ │        │ │DataService   │
└─────────┘ └────────┘ └───────┬──────┘
                               │
                          ┌────▼────────┐
                          │ Utils Layer │
                          │             │
                          │ Performance │
                          │ Keyboard    │
                          │ DOMHelpers  │
                          └─────────────┘
```

## Layer Responsibilities

### **Presentation Layer** (visual.ts)
- Coordinates all UI components and services
- Handles Power BI lifecycle events (update, constructor)
- Manages formatting settings
- Orchestrates data flow between layers

### **UI Component Layer**
Independent, reusable UI components:
- **SearchBox**: Search input with icons and events
- **Dropdown**: Hierarchical list with keyboard navigation
- **ItemCounter**: Selection count badge
- **SelectAllButton**: Bulk selection button
- **SelectedItemsContainer**: Selected items chips

### **Service Layer**
Business logic and state management:
- **DataService**: Data transformation, filtering, tree operations
- **FilterService**: Power BI filter application and removal
- **SelectionManager**: Selection state and multi-select logic

### **Utility Layer**
Shared utilities and helpers:
- **Performance**: debounce, throttle, memoize
- **Keyboard**: Navigation handlers and key constants
- **DOMHelpers**: Safe DOM manipulation

## Data Flow

```
User Action
    │
    ▼
UI Component (captures event)
    │
    ▼
Visual.ts (handles event)
    │
    ├──► SelectionManager (updates state)
    │
    ├──► DataService (filters data)
    │
    ├──► UI Components (re-render)
    │
    └──► FilterService (apply to Power BI)
```

## Component Communication

### Event-Driven Architecture
Components communicate via callbacks:

```typescript
// UI Component emits event
searchBox.onChange((value) => {
    // Visual handles event
    this.handleSearchChange(value);
});

// Visual updates services and components
this.selectionManager.update();
this.dropdown.render();
```

### Benefits:
- **Loose Coupling**: Components don't know about each other
- **Testability**: Easy to mock callbacks
- **Flexibility**: Easy to add/remove components

## Design Patterns Used

### 1. **Single Responsibility Principle**
Each class has one clear responsibility

### 2. **Dependency Injection**
Dependencies passed via constructor:
```typescript
constructor(parent: HTMLElement, config: Config) {
    this.config = config;
    // ...
}
```

### 3. **Composition over Inheritance**
Visual composed of multiple components rather than inheritance

### 4. **Observer Pattern**
Event callbacks for component communication

### 5. **Factory Pattern**
Static methods in services for object creation:
```typescript
DataService.createLeafNode(value);
DataService.transformTreeData(node);
```

## Extension Points

### Adding New Features

#### 1. New UI Component
```typescript
// Create: src/ui/NewComponent.ts
export class NewComponent {
    constructor(parent: HTMLElement, config) {
        // initialization
    }
}

// Use in visual.ts
this.newComponent = new NewComponent(this.target, {
    onEvent: (data) => this.handleEvent(data)
});
```

#### 2. New Service
```typescript
// Create: src/services/NewService.ts
export class NewService {
    static processData(data) {
        // logic
    }
}

// Use in visual.ts
import { NewService } from "./services/NewService";
const result = NewService.processData(this.data);
```

#### 3. New Utility
```typescript
// Create: src/utils/newUtil.ts
export class NewUtil {
    static helperMethod() {
        // utility logic
    }
}
```

## Testing Strategy

### Unit Tests
Each module can be tested independently:

```typescript
// Test DataService
describe('DataService', () => {
    it('should filter data correctly', () => {
        const data = [...];
        const result = DataService.filterData(data, 'search');
        expect(result).toEqual([...]);
    });
});

// Test SearchBox
describe('SearchBox', () => {
    it('should emit onChange event', () => {
        const spy = jest.fn();
        const searchBox = new SearchBox(element, {
            onSearchChange: spy
        });
        searchBox.setValue('test');
        expect(spy).toHaveBeenCalledWith('test');
    });
});
```

### Integration Tests
Test component interactions:

```typescript
describe('Visual Integration', () => {
    it('should update dropdown when search changes', () => {
        const visual = new Visual(options);
        visual.update(data);
        // Test interactions
    });
});
```

## Performance Considerations

### 1. **Debouncing**
Search input debounced at 300ms to reduce re-renders

### 2. **Efficient DOM Updates**
Components only update when data changes

### 3. **Memory Management**
Event listeners properly cleaned up

### 4. **Future Optimizations**
- Virtual scrolling for large lists
- Memoization of filtered results
- Web Workers for heavy computations

## Security

### XSS Prevention
- No innerHTML usage (replaced with DOM API)
- Text content sanitized via textContent
- SVG created with createElementNS

### Type Safety
- TypeScript interfaces ensure type correctness
- Runtime validation where needed

## Browser Compatibility

All code uses standard ES6+ features supported by Power BI:
- Arrow functions
- Classes
- Template literals
- Promises (for future async operations)

## Future Architecture Enhancements

### 1. State Management
Consider adding centralized state:
```typescript
class StateManager {
    private state: VisualState;
    private subscribers: Function[];
    
    setState(newState: Partial<VisualState>) {
        this.state = { ...this.state, ...newState };
        this.notifySubscribers();
    }
}
```

### 2. Command Pattern
For undo/redo functionality:
```typescript
interface Command {
    execute(): void;
    undo(): void;
}

class SelectItemCommand implements Command {
    execute() { /* select */ }
    undo() { /* deselect */ }
}
```

### 3. Plugin System
For extensibility:
```typescript
interface Plugin {
    init(visual: Visual): void;
    onUpdate(data: any): void;
}

// Allow custom plugins
visual.registerPlugin(new CustomSearchPlugin());
```

## Conclusion

This architecture provides:
- ✅ **Clean separation** of concerns
- ✅ **Easy testing** with isolated modules
- ✅ **Scalability** for new features
- ✅ **Maintainability** with clear structure
- ✅ **Performance** with optimized patterns
- ✅ **Type safety** with TypeScript
- ✅ **Security** with safe DOM operations

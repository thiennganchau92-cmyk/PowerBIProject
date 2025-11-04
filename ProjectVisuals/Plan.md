# Custom Filter Panel for Power BI (pbiviz) — Requirements Specification

## 0) Executive summary

Build a custom “Filter Panel” Power BI custom visual (pbiviz) that centralizes multiple filter types (category, numeric, date, Top N, search) and applies them to the current filter context with **native-compliant behavior** (scope, AND/OR, persistence, bookmarks, RLS/OLS). The visual must be performant on Import and DirectQuery models and support bookmarks, theming, accessibility, and mobile layout.

---

## 1) Goals & scope

**Goals**

* Provide a single, compact panel to set **Visual/Page/Report**-scope filters.
* Support **multiple filter controls**: dropdown, multi-select checkbox, text search, numeric range, date (relative & absolute), Top N, include/exclude.
* Respect **Power BI filter semantics** (AND across fields, OR within multi-select).
* Sync with model context: reflect **current filter state** and allow **reset**.
* Be **fast**, accessible (WCAG AA), and **bookmark-friendly**.

**Out of scope**

* Building slicers for Q&A or Natural Language.
* Modifying model relationships or security.
* Arbitrary programmatic creation of calculated tables/measures.

---

## 2) Personas & usage

* **Analyst/Developer (Edit mode)** – configures bindings, default states, styles.
* **Business user (View/Reading mode)** – adjusts filters quickly, saves bookmarks.
* **Mobile user** – collapsible, touch-friendly layout.

---

## 3) Core user stories (functional)

1. As a viewer, I can filter by **Category** with multi-select + search.
2. As a viewer, I can filter **Measure between [min, max]** via slider or inputs.
3. As a viewer, I can set **Date** via **Between** and **Relative date** (e.g., last 30 days).
4. As a viewer, I can apply **Top N** (Top 10 by Sales).
5. As a viewer, I can **clear** the entire panel or a single control.
6. As a viewer, I can see **which filters are active** at a glance (badges/summary).
7. As an editor, I can **bind fields** to controls and set **default states**.
8. As an editor, I can choose **filter scope**: Visual, Page, Report.
9. As an editor, I can enable **“sync with native pane”** (read external context, don’t override).
10. As an editor, I can enable **query reduction** (apply-on-commit vs instant).

---

## 4) UX requirements

**Layout**

* Left column: control list with collapsible sections (Category, Measures, Date…).
* Right/Top area: **Active filter chips** with quick remove (×) and **Reset All**.
* **Apply** / **Cancel** footer when “commit mode” is on; otherwise auto-apply.

**Controls**

* Category: search box + select all + tri-state checkbox (all/some/none).
* Numeric: dual-handle slider + numeric inputs; optional presets (e.g., 0–100).
* Date: mode switch (Between / Relative); calendar picker & relative presets.
* Top N: integer input + “By” dropdown (bound measure) + order direction.

**Micro-interactions**

* Keyboard navigable; Enter to commit; Esc to cancel (if commit mode).
* Tooltip on truncated labels; loading spinners for large cardinality.
* “Show more” pagination for >1,000 category members (virtualization).

**Responsiveness**

* Breakpoints for 320, 480, 768, 1024, 1440+. Collapse sections on small screens.
* Mobile: drawer pattern with sticky Apply/Reset.

**Theming**

* Honor Power BI theme colors (foreground/background/accent) and typography.
* High contrast mode supported.

**Accessibility**

* Tab order, ARIA roles (`listbox`, `checkbox`, `slider`, `dialog`), visible focus, labels.
* Screen-reader friendly summaries: “Category: 3 selected.”

---

## 5) Logic & behavior

**Evaluation & scope**

* Panel generates filter expressions applied via host API:

  * **Visual scope**: apply to `this` visual only.
  * **Page scope**/**Report scope**: user-selectable in formatting pane.
* **AND across fields**; within a single categorical control, **OR** across multi-select values.
* When current model context already filters a field, the control:

  * **Reads** and **renders** that state (locked if “sync-only” mode enabled).
  * If user changes it, the panel **merges** (respecting selected scope).

**State & persistence**

* Internal UI state lives in `visualSettings` (formatting pane) and `enumerateObjectInstances`.
* Active filter state persists in **report bookmarks**, **personal bookmarks**, and **saved** PBIX/PBIX in Service.

**Interplay with native features**

* **Cross-filter/highlight** from other visuals: render as **pre-filtered** lists and ranges.
* **RLS/OLS**: never display inaccessible members; controls respect security-trimmed lists.
* **Sync with slicers**: if enabled, **do not fight**; only render & allow user to override by scope.

**Query reduction**

* Two modes:

  1. **Instant**: apply on every change (good for Import, small cardinality).
  2. **Commit**: “Apply” button batches changes (recommended for DirectQuery).

---

## 6) Data model & bindings

**Field roles (capabilities.json)**

* `categoryFields` (table/column; multiple allowed).
* `numericFields` (measures/columns numeric).
* `dateFields` (DateTime).
* `topByMeasure` (measure for Top N).
* `scopeSelector` (format property, not a role).

**Data sources**

* Populate members via `dataView.categorical.categories[0].values`.
* For very high cardinality, support **progressive fetch** via role re-binding or “search-only” loading (query reduction).

---

## 7) API behavior (Power BI Custom Visuals)

**Key APIs**

* `IVisualHost.applyJsonFilter(filter, objectName, propertyName, action)`
* `powerbi-models` filter types:

  * **BasicFilter** (In/NotIn)
  * **AdvancedFilter** (And/Or with operators: Contains, StartsWith, GreaterThan, Between…)
  * **RelativeDateFilter**
  * **TopNFilter`

**Examples**
*Basic (multi-select OR in a field)*

```ts
const filter: powerbi.models.IBasicFilter = {
  $schema: "http://powerbi.com/product/schema#basic",
  target: { table: "Sales", column: "Category" },
  operator: "In",
  values: ["Bikes", "Accessories"]
};
host.applyJsonFilter(filter, "panel", "category", powerbi.FilterAction.merge);
```

*Advanced (Between numeric)*

```ts
const f: powerbi.models.IBasicFilter = {
  $schema: "http://powerbi.com/product/schema#basic",
  target: { table: "Sales", column: "Amount" },
  operator: "In",
  values: [] // use AdvancedFilter for operators
};
const adv = new powerbi.models.AdvancedFilter(
  { table: "Sales", column: "Amount" },
  "And",
  [{ operator: "GreaterThanOrEqual", value: min }, { operator: "LessThanOrEqual", value: max }]
);
host.applyJsonFilter(adv, "panel", "amount", powerbi.FilterAction.merge);
```

*Relative date*

```ts
const rel: powerbi.models.IRelativeDateFilter = {
  $schema: "http://powerbi.com/product/schema#relativeDate",
  target: { table: "Calendar", column: "Date" },
  operator: "InLast",
  timeUnitsCount: 30,
  timeUnit: powerbi.models.RelativeDateFilterTimeUnit.days,
  includeToday: true
};
host.applyJsonFilter(rel, "panel", "date", powerbi.FilterAction.merge);
```

*Top N*

```ts
const topN = new powerbi.models.TopNFilter(
  { table: "Product", column: "ProductName" },
  "Top",
  n,
  { table: "Sales", measure: "Total Sales" }
);
host.applyJsonFilter(topN, "panel", "topN", powerbi.FilterAction.merge);
```

**Removing filters**

```ts
host.applyJsonFilter(null, "panel", "category", powerbi.FilterAction.remove);
```

**Reading existing context**

* Use `options.jsonFilters` (when available) and `dataView.metadata.objects` to reflect active filters in UI.

---

## 8) Formatting pane (objects)

* `Panel`:

  * `scope`: Enum { Visual, Page, Report }
  * `applyMode`: Enum { Instant, Commit }
  * `showActiveChips`: boolean
  * `showReset`: boolean
  * `denseMode`: boolean
* `Controls` (repeated group per control):

  * `type`: Enum { Category, Numeric, Date, TopN }
  * `label`: text
  * `boundField`: role selector
  * `defaultState`: JSON (values/min/max/relative)
  * `allowSearch`: boolean
  * `multiSelect`: boolean
  * `showSelectAll`: boolean
  * `presets`: text (CSV ranges, e.g., “0–100;100–500;500–1000”)
* `Theming`:

  * `accentColor`, `chipStyle`, `borderRadius`, `elevation`.

---

## 9) Performance & reliability (non-functional)

**Performance budgets**

* Initial render < **300ms** (Import), < **600ms** (DirectQuery) on mid-tier dataset.
* Interactions (expand list, toggle checkbox) < **100ms** UI response.
* Virtualize lists > **1,000** items (windowing).
* Debounce search input (≥250ms).
* Batch filter writes in **Commit** mode.

**Stability**

* Gracefully degrade if a bound field is removed/renamed.
* Handle empty results (“No matching values”).

**Telemetry (optional)**

* Track apply events, resets, average commit size, and error counts (opt-in).

---

## 10) Security & compliance

* Respect **RLS/OLS**; never reveal restricted members.
* No data exfiltration; no external network calls.
* Use only Power BI SDK APIs; no eval/dynamic script injection.
* Localize text; avoid PII storage in settings.

---

## 11) Testing & acceptance criteria

**Unit tests**

* Filter builders (basic/advanced/relative/TopN) return valid JSON.
* Merge/remove actions behave correctly.

**Integration tests (pbiviz in Desktop)**

* Import vs DirectQuery models (large cardinality category + measure).
* Bookmark save/restore, Page/Report scope.
* Interaction with a native slicer (sync mode on/off).

**Accessibility**

* Keyboard-only flow; screen reader announces control & state.
* Contrast ≥ 4.5:1; focus ring visible.

**Acceptance checklist**

* [ ] All control types work with Merge/Remove.
* [ ] Scope switch changes target correctly.
* [ ] Active chips always reflect true state.
* [ ] Reset clears panel and removes filters.
* [ ] Bookmarks restore panel and model context.
* [ ] No crashes when fields are missing or RLS trims members.

---

## 12) Deliverables

* **Source**: TypeScript React pbiviz project (VS Code ready).
* `capabilities.json` with roles/objects described above.
* **README**: setup, build, test, packaging, known limits.
* **Style guide**: theming tokens + accessibility notes.
* **Sample PBIX**: import & DirectQuery demos with bookmarks.

---

## 13) Known limitations & guidance

* TopN requires a valid **measure**; warn if unbound.
* Relative date filter requires a true Date column (not text).
* Page/Report scope writes may be blocked in some embedding contexts.
* Very high cardinality categories: default to **search-first** mode.

---

## 14) Implementation scaffold (high-level)

```
/src
  /visual.ts         // lifecycle (constructor, update, enumerateObjects)
  /host.ts           // wrapper for apply/remove filters, read context
  /state.ts          // panel UI state + mapping to filter JSON
  /components/
    Panel.tsx
    ControlCategory.tsx
    ControlNumeric.tsx
    ControlDate.tsx
    ControlTopN.tsx
    ActiveChips.tsx
  /filters/
    buildBasic.ts
    buildAdvanced.ts
    buildRelative.ts
    buildTopN.ts
  /utils/
    debounce.ts
    virtualization.ts
capabilities.json
pbiviz.json
```

---

If you want, I can generate a **starter pbiviz project** that implements:

* Category + Numeric + Date (Between/Relative) + Top N
* Instant/Commit apply modes
* Visual/Page/Report scope toggle
* Active filter chips + Reset All
* Virtualized category list + search

Say the word and I’ll output the scaffold with ready-to-run code.

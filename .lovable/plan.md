

## Plan: Compact Planner Layout

**Problem**: The planner calendar takes up the full viewport height (`h-[calc(100vh-12rem)]`) with large empty spaces in day columns. The Sales Assistant buttons below are pushed off-screen.

**Changes** (single file: `src/components/admin/PlannerTab.tsx`):

1. **Remove fixed height** from the calendar container — change `h-[calc(100vh-12rem)]` to `min-h-[120px]` so it grows naturally with task content.

2. **Remove `min-h-[200px]`** from the task area inside `DayColumn` — replace with `min-h-[60px]` so empty days are compact.

3. **Remove `flex-1`** from the task area so it doesn't stretch to fill available space — just use natural height.

This way the calendar is compact when there are few tasks, and grows automatically as tasks are added. The Sales Assistant panel and forecast buttons will always be visible below.


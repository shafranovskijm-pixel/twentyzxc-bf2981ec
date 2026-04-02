

## Problem

The "Действия" (Actions) column with the dropdown menu is cut off at the right edge of the contracts table. The table uses `min-w-[900px]` which is too narrow for all columns, and the container clips the last column.

## Fix

1. **Increase table min-width** from `900px` to `1100px` in `ContractsTab.tsx` (line 387) to ensure the Actions column has enough space.

2. **Make the Actions column sticky** on the right side so it's always visible even when scrolling horizontally. Add `sticky right-0 bg-background` classes to both the `TableHead` and `TableCell` for the Actions column.

### File: `src/components/admin/ContractsTab.tsx`

- Line 387: Change `min-w-[900px]` to `min-w-[1100px]`
- Line 398: Add sticky positioning to the Actions `TableHead`: `className="w-[80px] text-right sticky right-0 bg-background"`
- Line 438: Add sticky positioning to the Actions `TableCell`: `className="text-right sticky right-0 bg-background"`

This ensures the action menu button (⋮) is always visible regardless of table width or horizontal scroll position.


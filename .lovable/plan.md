

## Plan: Selectable import list with checkboxes

### Problem
The import dialog shows all 37 new clients and imports them all at once. The user wants to pick only 2-3 organizations from the list.

### What changes

#### Edit `src/components/admin/ClientsTab.tsx`

1. **Add selection state**: Change `importConfirm` to also track a `selectedNames: Set<string>` — initially all unchecked (empty set), so the user opts in manually.

2. **Add checkboxes to each row** in the import dialog list. Each row gets a `Checkbox` that toggles inclusion in `selectedNames`.

3. **Add "Select all / Deselect all" toggle** at the top of the list for convenience.

4. **Update counter text**: Show "Выбрано X из Y" instead of just total count.

5. **Disable "Импортировать" button** when `selectedNames` is empty.

6. **Update `confirmImport`**: Only insert rows whose names are in `selectedNames`, not all names.

7. **No auto-import on new contracts** — new contracts do NOT automatically create client records. The user must click "Импорт из договоров" each time. This keeps the client list clean and intentional.

### Files
- **Edit**: `src/components/admin/ClientsTab.tsx` — add Checkbox import, selection state, update dialog UI and confirm logic




## Plan: Add bulk folder deletion to Files tab

### What it does
Adds a "Удалить папки" (Delete folders) button that enables a selection mode with checkboxes on each folder card. The user can check multiple folders, then confirm bulk deletion of the selected contracts' files and the contracts themselves.

### Steps

#### 1. Update `src/components/admin/FilesTab.tsx`
- Add state: `selectMode: boolean`, `selectedIds: Set<string>`
- Add a "Удалить папки" toggle button next to "Загрузить папку целиком" that toggles selection mode
- In selection mode: show checkboxes on each folder row, a count of selected items, and "Удалить выбранные" / "Отмена" buttons
- Bulk delete handler:
  1. Show confirmation dialog (AlertDialog) listing selected folder names
  2. For each selected contract: delete all files from storage (`contracts/{id}/...`), delete `contract_files` DB rows, then archive the contract (`is_archived = true`) — or fully delete if preferred
  3. Invalidate queries and exit selection mode
- Use `is_archived = true` approach (soft delete) to avoid data loss — matches the existing archive pattern in ContractsTab

#### 2. Update `src/components/admin/files/FilesFolderCard.tsx`
- Add optional props: `selectable?: boolean`, `selected?: boolean`, `onSelect?: () => void`
- When `selectable` is true, render a `Checkbox` before the folder icon
- Clicking the checkbox calls `onSelect`; clicking the rest of the row still toggles open/close

### Files
- **Edit**: `src/components/admin/FilesTab.tsx` — add selection mode, bulk archive logic, confirmation dialog
- **Edit**: `src/components/admin/files/FilesFolderCard.tsx` — add checkbox prop support


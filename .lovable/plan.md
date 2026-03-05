

## Diagnosis

**Root cause: All queries to the database are hanging/timing out from the client side.**

Evidence:
- Database has 113 active contracts, 146 files, 1 generated document — data exists
- The ЭЛАРА КЛИНИК contract and documents were **never saved** — the background save in `generate()` silently failed (no record in `generated_documents` or `contracts`)
- The Contracts tab shows "Активные (0)" with a spinner — the query hangs indefinitely
- The Files tab also hangs (reported earlier)
- No network errors captured in logs

The `ContractsTab` query has no timeout protection (unlike `FilesTab` which we already patched). When a query hangs, the UI shows a spinner forever with no way to retry.

## Plan

### 1. Fix ContractsTab infinite loading
- Add a 10-second timeout to the contracts query (same pattern as FilesTab)
- Add error state with retry button
- Add `retry: 1` to prevent infinite retries

### 2. Fix document save reliability in DocumentsTab
- The ЭЛАРА КЛИНИК save failed silently. Add explicit `toast.error` for **every** failure point and ensure the error is visible
- Add a retry/re-save button in the preview dialog so user can retry saving if the background save fails
- Show a status indicator in the preview dialog: "Сохранение..." → "Сохранено" or "Ошибка сохранения"

### 3. Add timeout to all admin queries
- Wrap the `generated_documents` query in DocumentsTab with the same timeout pattern
- Ensure all admin tab queries have consistent timeout + error + retry behavior

### Files to modify
- `src/components/admin/ContractsTab.tsx` — add timeout, error state, retry
- `src/components/admin/DocumentsTab.tsx` — add save status indicator, retry button, timeout on history query


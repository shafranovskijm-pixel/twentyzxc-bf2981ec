

## Plan: Add "Sync by INN" to Client Requisites

### Problem
The "Синхронизировать" button searches DaData by company name, which can return outdated or wrong results. User wants to search by INN instead (or in addition).

### Solution
Modify `syncRequisites` in `ClientsTab.tsx` to prefer INN over name:

1. **Update `syncRequisites` function** (line 122-138): If `inn` field has a valid value (10-12 digits), call `dadata-lookup` with `{ inn }` instead of `{ query: name }`. Fall back to name search if INN is empty.

2. **Add a search button next to the INN field** (line 310): Add a small search icon button next to the INN input (like in RequisitesTab) that triggers sync by INN directly.

3. **Add `fetchDadataByInn` helper** or modify `fetchDadataByName` to accept INN — the edge function already supports `inn` parameter, so just pass `{ inn }` instead of `{ query }`.

### Files to modify
- `src/components/admin/ClientsTab.tsx`


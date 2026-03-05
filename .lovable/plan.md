

## Problem

The Files tab sorts contracts by `contract_number DESC`. The user wants the most recently created contract to appear first — i.e., sort by `created_at DESC` (or `updated_at DESC`).

## Plan

**File: `src/components/admin/FilesTab.tsx`** (line 44)

Change the query ordering from:
```
.order("contract_number", { ascending: false })
```
to:
```
.order("created_at", { ascending: false })
```

This ensures the newest contract (e.g., one just generated for ЭЛАРА КЛИНИК) appears at the top of the folder list.


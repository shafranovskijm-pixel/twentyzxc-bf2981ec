

## Plan: Add "Fill from contract" button to client requisites

### Problem
The client card shows wrong requisites (INN `7841084450` instead of `2721223198` for ООО "АВРОРА") because DaData returned data for a different organization. The user wants to pull the correct INN directly from the contract documents.

### What changes

#### Edit `src/components/admin/ClientsTab.tsx`

1. **Add a "Из договора" button** next to the existing "Синхронизировать" button in the requisites section header (line ~486).

2. **Add `fillFromContract` function** that:
   - Queries `generated_documents` for the current client name (`name`) to get `client_inn`
   - If INN found, sets it in the `inn` state field
   - Then optionally calls DaData with this correct INN to fill KPP, OGRN, address, director
   - Shows toast with result

3. **Button placement**: Next to the existing sync button, with a `FileText` icon and label "Из договора".

### Flow
```text
Click "Из договора" → query generated_documents by client_name
→ get client_inn → set inn field → auto-call DaData with correct INN
→ fill kpp, ogrn, legal_address, director_name, director_post
```

### Files
- **Edit**: `src/components/admin/ClientsTab.tsx` — add button and fillFromContract logic


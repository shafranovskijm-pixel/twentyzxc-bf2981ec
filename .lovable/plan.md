

## Plan: Add "Акт" button to client card header with auto-fill from existing documents

### Problem
No "Акт" button in client card header. When creating an act, user has to manually re-enter all data. The act should auto-fill services, contract number/date from previously generated documents for this client.

### Changes

#### 1. Edit `src/components/admin/ClientsTab.tsx`
Add an "Акт" button next to "Договор" and "Счёт" in the header (line ~478). Same pattern: save client, then navigate with `docType: "act"`.

```tsx
<Button variant="outline" size="sm" onClick={async () => { await saveClient(); onNavigate("documents", { clientName: name, docType: "act" }); }} title="Сделать акт">
  <CheckSquare className="w-4 h-4 mr-1" /> Акт
</Button>
```

#### 2. Edit `src/components/admin/DocumentsTab.tsx`
In the "Pre-fill from client card navigation" `useEffect` (lines 225-238), when `docType === "act"`, auto-find the latest contract for this client from the `contracts` array and:
- Set `linkedContractId` to that contract
- Fill `services` from that contract's generated documents (using existing `fillServicesFromContract`)
- Set contract number/date references

This way the user only needs to set the act date — everything else pulls from existing data.

### Files
- **Edit**: `src/components/admin/ClientsTab.tsx` — add Акт button
- **Edit**: `src/components/admin/DocumentsTab.tsx` — auto-fill act data from client's latest contract


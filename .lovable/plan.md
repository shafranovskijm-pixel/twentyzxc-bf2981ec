

## Plan: Auto-create Client When Generating a Document

### Problem
When generating a document for a new client (e.g. "ГРАНД АВТО", "АНТА"), the system auto-creates a **contract** record but does NOT create a **client** record. The user expects a client card to appear automatically.

### Fix in `src/components/admin/DocumentsTab.tsx`

After the contract auto-creation (Step 2, ~line 503), add a new step that:

1. Checks if a client with the given `clientName` already exists in the `clients` table
2. If not found, inserts a new client record with all available requisites (name, INN, KPP, OGRN, address, director name/post, email)
3. Invalidates the `doc-clients` and `planner-clients` query caches

This runs for ALL document types (contract, invoice, act), not just contracts.

### Technical Details

```typescript
// After Step 2 (contract auto-creation), add Step 2.5:
const existingClient = clients.find(c => c.name === clientName);
if (!existingClient && clientName.trim()) {
  const { error: clientError } = await supabase.from("clients").insert({
    name: clientName,
    inn: clientInn || null,
    kpp: clientKpp || null,
    ogrn: clientOgrn || null,
    legal_address: clientAddress || null,
    director_name: clientDirectorName || null,
    director_post: clientDirectorPost || null,
  });
  if (!clientError) {
    queryClient.invalidateQueries({ queryKey: ["doc-clients"] });
    queryClient.invalidateQueries({ queryKey: ["planner-clients"] });
  }
}
```

### Files to Modify
- `src/components/admin/DocumentsTab.tsx` — add client auto-creation logic after Step 2


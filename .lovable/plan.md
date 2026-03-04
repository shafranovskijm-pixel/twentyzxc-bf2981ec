

## Diagnosis

The save operation hangs because `updateMultiple` fires **18 parallel individual upsert requests** to the database. Each request goes through the network independently, and if any single one stalls or fails silently, the entire `Promise.all` never resolves, leaving the spinner spinning indefinitely.

Additionally, the `value` column is `jsonb`, but the code does `JSON.stringify(value)` which double-encodes strings that are already plain text (e.g. `"text"` becomes `"\"text\""` in the DB).

## Plan

### 1. Replace parallel requests with a single batch upsert

Refactor `updateMultiple` in `use-site-settings.tsx` to send **one** upsert call with an array of all rows, instead of 18 individual calls:

```typescript
mutationFn: async (entries) => {
  const rows = entries.map(e => ({
    key: e.key,
    value: e.value, // pass raw value, jsonb column handles it
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("site_settings" as any)
    .upsert(rows as any, { onConflict: "key" });
  if (error) throw error;
}
```

### 2. Fix double JSON encoding

Since the `value` column is `jsonb`, passing a plain string directly works — PostgREST wraps it as a JSON string automatically. Remove `JSON.stringify()` wrapping from both `updateSetting` and `updateMultiple` to prevent double-encoding like `"\"text\""`.

### 3. Add timeout protection to handleSave

Wrap the save call with a timeout in `RequisitesTab.tsx` so the spinner can't hang indefinitely:

```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('timeout')), 10000)
);
await Promise.race([updateMultiple.mutateAsync(entries), timeoutPromise]);
```

### Files to modify
- `src/hooks/use-site-settings.tsx` — batch upsert + remove JSON.stringify
- `src/components/admin/RequisitesTab.tsx` — add save timeout


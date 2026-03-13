

## Current Behavior

Line 872 in `DocumentsTab.tsx`:
```typescript
if (client && !client.email && emailTo.trim()) {
  await supabase.from("clients").update({ email: emailTo.trim() }).eq("id", client.id);
}
```

The email is saved to the client record **only if the client has no email yet**. If the client already has an email, the entered address is silently ignored.

## Proposed Fix

Update the condition so the email is **always** saved/updated on the client record when sending a document. This way, whenever you send to a new address, the client's email stays current.

### Change in `DocumentsTab.tsx` (line 872)

Replace:
```typescript
if (client && !client.email && emailTo.trim()) {
```
With:
```typescript
if (client && emailTo.trim()) {
```

This single-line change ensures the client's email is always updated to the last address used for sending documents.

### Files to modify
- `src/components/admin/DocumentsTab.tsx` — remove `!client.email` condition (1 line)




## Plan: Move document buttons to top of client edit form and ensure requisites are pre-filled

### Problem
The "Договор", "Счёт", and "Telegram" buttons are at the bottom of the client edit form (line ~551-572), making them hard to find. The user wants them at the top. Additionally, the user wants requisites to be automatically filled in the document constructor when navigating from the client card.

### What changes

#### Edit `src/components/admin/ClientsTab.tsx`

1. **Move the action buttons** (Договор, Счёт, Telegram) from the bottom `flex-wrap` block (lines 556-572) up into the card header area (line 470-473), next to the title "Редактировать клиента" and the close button. This makes them immediately visible when opening a client.

2. **Ensure requisites are saved before navigating**: Before calling `onNavigate("documents", ...)`, first save the current client data (call `saveClient`) so that when DocumentsTab loads and calls `fillClientFromName`, it finds the up-to-date requisites (INN, KPP, OGRN, address, director) in the `clients` table. This solves the "requisites not pulling" issue.

3. **Keep the Save/Update button** at the bottom as-is, just remove the duplicate document buttons from there.

### Technical detail
- The DocumentsTab already has `fillClientFromName` that looks up the client by name in the `clients` array and fills all requisite fields. The problem is that if the client was just edited but not saved, the requisites aren't in the DB yet. The fix is to auto-save before navigating.
- The header will have: title on the left, action buttons + close button on the right.

### Files
- **Edit**: `src/components/admin/ClientsTab.tsx`


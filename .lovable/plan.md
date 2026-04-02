

## Plan: Import clients from contracts

### What it does
Adds a button "Импорт из договоров" in the Clients tab that finds all unique `client_name` values from the `contracts` table that don't already exist in `clients`, and creates client records for them automatically.

### Steps

#### 1. Edit `src/components/admin/ClientsTab.tsx`
- Add an "Импорт из договоров" button next to "Синхр. все реквизиты" and "+ Добавить"
- On click, run the import logic:
  1. Fetch all distinct `client_name` from `contracts`
  2. Fetch all existing `name` from `clients`
  3. Find the difference (contract names not in clients)
  4. If none found — show toast "Все клиенты уже импортированы"
  5. If found — show a confirmation dialog listing the count of new clients
  6. On confirm: batch-insert new rows into `clients` with `name` set from `client_name`, and `service_type` derived from `contract_type` if available (e.g. "ФРДО" contracts → service_type "ФРДО")
  7. Invalidate the clients query to refresh the list
- Show a loading spinner during import

#### Details
- For each new client, also pull `contract_number`, `contract_date` from the most recent contract for reference
- Group duplicate/similar contract names by exact match only (no fuzzy matching — keep it simple)
- No database migration needed — just inserting into existing `clients` table

### Files
- **Edit**: `src/components/admin/ClientsTab.tsx` — add import button and logic


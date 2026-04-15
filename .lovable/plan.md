

## Plan: Service deadline in client card + Telegram reminders

### What changes

#### 1. Database: add `service_deadline` column to `clients`
Add a nullable `date` column `service_deadline` to the `clients` table — this will store the end date of the service period extracted from the latest contract.

#### 2. Edit `src/components/admin/ClientsTab.tsx`
- Add `serviceDeadline` state field and display it as a read-only date input in the client edit form (next to "Дата оплаты" / payment_date).
- When opening a client for editing, auto-fetch the latest contract for this client from `contracts` table, find the latest generated contract document, parse the `deadline` field to extract the end date, and set it as `service_deadline`.
- Also allow manual override of the date.
- Save `service_deadline` to the database on client save.
- In the client list, show the deadline date with color coding (red if < 1 month, yellow if < 3 months).

#### 3. Edit `src/components/admin/DocumentsTab.tsx`
After generating a contract, update the corresponding client's `service_deadline` with the end date parsed from the `deadline` field. For FRDO-style deadlines like "05.03.2026 по 05.03.2027", extract the second date. For "30 рабочих дней", calculate from contract date.

#### 4. Edit `supabase/functions/check-overdue/index.ts`
Add a new check section for service deadlines:
- Query `clients` where `service_deadline` is not null
- Filter for deadlines exactly 3 months, 2 months, and 1 month away
- Send Telegram reminders with client name and remaining time

### Technical details

**Deadline parsing logic**: 
- If deadline contains "по" (e.g., "05.03.2026 по 05.03.2027"), extract the date after "по" and parse as DD.MM.YYYY
- If deadline is "N рабочих дней", calculate from contract date + N business days
- Store as ISO date in `service_deadline`

**Telegram reminder format**:
```
📋 Истекающие сроки услуг:
🟡 Через 3 мес: ClientName (до 05.03.2027)
🟠 Через 2 мес: ClientName (до 05.03.2027)
🔴 Через 1 мес: ClientName (до 05.03.2027)
```

### Files
- **Migration**: Add `service_deadline date` column to `clients`
- **Edit**: `src/components/admin/ClientsTab.tsx` — display + auto-fill deadline
- **Edit**: `src/components/admin/DocumentsTab.tsx` — update client deadline on contract generation
- **Edit**: `supabase/functions/check-overdue/index.ts` — add 3/2/1 month reminders


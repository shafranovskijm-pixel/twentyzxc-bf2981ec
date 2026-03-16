

## Plan: Add Renewal Indicators to Contracts Table + Fix Edge Function + Add ФРДО Reminders

### Bug Found
There is a **critical brace mismatch** in `check-overdue/index.ts`: the renewal reminder section (lines 122-132) is nested inside the `if (overdueCount > 0)` block. This means renewal notifications only appear when there are also overdue contracts. Must fix.

### Changes

#### 1. Fix + Extend `supabase/functions/check-overdue/index.ts`
- **Fix brace bug**: Move the closing `}` of the overdue block (line 120) to before the renewal section
- **Add ФРДО contracts**: Change the filter from `eq("contract_type", "Сайт")` to `in("contract_type", ["Сайт", "ФРДО"])` so both types get anniversary reminders
- Update the message label to say "Продление договоров через 2 недели" (without specifying only «Сайт»)

#### 2. Add visual indicator in `src/components/admin/ContractsTab.tsx`
- Add a helper function `isApproachingAnniversary(contractDate, contractType)` that checks if a "Сайт" or "ФРДО" contract's anniversary is within 14 days
- Display a 🔄 icon (RefreshCw) or a bell icon next to the contract date/type in the table, with a tooltip like "Продление через X дней"
- Show this indicator in both mobile cards and desktop table rows

#### 3. Test: Invoke check-overdue function
- After deploying, call the function to send a test Telegram message with the current state of overdue/expiring/renewal contracts

### Files to Modify
- `supabase/functions/check-overdue/index.ts` — fix braces, add ФРДО
- `src/components/admin/ContractsTab.tsx` — add anniversary indicator


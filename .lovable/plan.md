

## Plan: Add "Create Document" and "Send Telegram" buttons to Client Card

### What the user wants
From the client editing form, quickly create a contract, invoice, or send a Telegram message — without manually navigating to the Documents tab and re-entering client info.

### Changes

#### 1. `ClientsTab.tsx` — Accept `onNavigate` prop, add action buttons

- Add prop: `onNavigate?: (section: string, params?: { clientName?: string; docType?: string }) => void`
- In the client edit form (near the "Обновить" button at the bottom), add a row of action buttons:
  - **Сделать договор** — calls `onNavigate("documents", { clientName: name, docType: "contract" })`
  - **Сделать счёт** — calls `onNavigate("documents", { clientName: name, docType: "invoice" })`
  - **Написать в Telegram** — opens the client's Telegram link (if present) or sends a notification via the existing send-telegram edge function

#### 2. `Admin.tsx` — Wire up navigation from ClientsTab to DocumentsTab

- Pass `onNavigate` to `ClientsTab` that sets `docInitialClientName`, `docInitialDocType`, and switches to `"documents"` section
- Pass `initialClientName={docInitialClientName}` to `DocumentsTab`

#### 3. `DocumentsTab.tsx` — Accept `initialClientName` prop

- Add `initialClientName?: string` to props
- In useEffect, when `initialClientName` is set (and clients are loaded), auto-fill the client fields using `fillClientFromName(initialClientName)` and set `clientName`
- Also set `docType` from `initialDocType` if provided
- Clear via `onMounted` callback

### Files to modify
- `src/components/admin/ClientsTab.tsx` — add `onNavigate` prop + action buttons
- `src/pages/Admin.tsx` — pass `onNavigate` to ClientsTab, pass `initialClientName` to DocumentsTab
- `src/components/admin/DocumentsTab.tsx` — accept and handle `initialClientName` prop


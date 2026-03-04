

## Plan: Enhance Clients tab + Sidebar drag-and-drop sorting

### 1. Database migration — add columns to `clients` table
New columns:
- `service_type` text (nullable, default null) — values: "ФРДО", "САЙТ", "ПРОЧЕЕ"
- `frdo_login` text (nullable)
- `frdo_password` text (nullable)  
- `payment_date` date (nullable) — дата оплаты

### 2. Update `ClientsTab.tsx`
- Add new columns to the table: **Услуга**, **Логин ФРДО**, **Пароль ФРДО**, **Оплата**
- **Услуга** — render as colored badge with quick-select (dropdown/select with 3 options: ФРДО, САЙТ, ПРОЧЕЕ), clickable inline to change
- Add corresponding fields to the edit form
- Make client name clickable (like in ContractsTab) — `onClick={() => startEdit(c)}` with hover styling
- Remove pencil button (name click replaces it)
- Add `service_type`, `frdo_login`, `frdo_password`, `payment_date` to state, form, save payload, and interface

### 3. Sidebar drag-and-drop reordering (`AdminSidebar.tsx`)
- Use `@dnd-kit/sortable` (already installed) to make menu items draggable
- Store menu order in `localStorage` for persistence
- Add drag handle (grip icon) on hover for each menu item

### Files to modify
- `src/components/admin/ClientsTab.tsx` — new columns, clickable name, form fields
- `src/components/admin/AdminSidebar.tsx` — dnd-kit sortable menu items
- Database migration — add 4 columns to `clients`


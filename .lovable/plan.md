

## Plan: Admin sidebar + file manager for contracts

### What changes

1. **Replace top tabs with a collapsible sidebar** in the Admin page
   - Use the existing `Sidebar` component from shadcn (`src/components/ui/sidebar.tsx`)
   - Wrap Admin in `SidebarProvider` with `collapsible="icon"` mode
   - Menu items: SEO, Contacts, Promotions, Clients, Contracts, **Files** (new)
   - Sidebar starts collapsed; clicking items expands and shows the corresponding content
   - Keep the logout button in the sidebar footer

2. **Create a new "Files" tab (contract file manager)**
   - New component `src/components/admin/FilesTab.tsx`
   - Displays contract files organized as folder cards (one folder per client/contract)
   - Each folder shows client name, contract number, file count
   - Click a folder to expand and see uploaded files inside
   - Support drag-and-drop file upload into folders (using native HTML5 drag events)
   - Files stored in the existing `contracts` private storage bucket
   - Each contract's `file_path` field already exists; we'll extend to support multiple files by storing paths as JSON array or using a naming convention in storage

3. **Database consideration**
   - The `contracts` table already has `file_path` (single text). To support multiple files per contract, we'll create a new `contract_files` table:
     - `id`, `contract_id` (FK to contracts), `file_name`, `file_path`, `file_size`, `created_at`
     - RLS: admin-only access (same as contracts)
   - This lets each contract folder contain multiple files

4. **Admin page restructure**
   - Move all existing tab content (SEO, Contacts, Promotions, Clients, Contracts) into sidebar-driven sections
   - Active section stored in state, rendered in the main content area
   - Sidebar uses icons from lucide-react matching current tab icons

### Files to create/modify
- `src/pages/Admin.tsx` — restructure layout with Sidebar
- `src/components/admin/FilesTab.tsx` — new file manager component
- Database migration — `contract_files` table + RLS policies


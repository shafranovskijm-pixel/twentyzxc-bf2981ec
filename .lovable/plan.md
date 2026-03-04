

## Plan: Calendar-planner with tasks (drag-and-drop + statuses)

### Overview
New admin section "Планер" — a calendar view with tasks that can be:
- Linked to clients/contracts or standalone personal tasks
- Dragged between days and reordered within a day
- Moved between status columns (todo / in progress / done)

### 1. Database migration — create `tasks` table

```sql
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  task_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'todo',  -- 'todo', 'in_progress', 'done'
  sort_order integer NOT NULL DEFAULT 0,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### 2. New component: `src/components/admin/PlannerTab.tsx`

**Layout**: Week view (Mon–Sun) with day columns, each day showing task cards grouped by status.

**Features**:
- **Week navigation**: prev/next week buttons, "Today" button
- **Task cards**: title, optional client/contract badge, status color indicator
- **Drag-and-drop** (`@dnd-kit`): drag tasks between days and reorder within a day; drag between status lanes
- **Status toggle**: click to cycle through todo → in_progress → done (with colored badges: gray/yellow/green)
- **Add task**: quick-add form per day (title + optional client select + optional contract select)
- **Edit/delete**: inline edit on click, delete button

### 3. Update `AdminSidebar.tsx`
- Add "Планер" menu item with `CalendarDays` icon

### 4. Update `Admin.tsx`
- Add `"planner"` section case rendering `<PlannerTab />`
- Add title to `sectionTitles`

### Files to create/modify
- **Create** `src/components/admin/PlannerTab.tsx` — full planner component
- **Edit** `src/components/admin/AdminSidebar.tsx` — add menu item
- **Edit** `src/pages/Admin.tsx` — add section + import
- **Migration** — create `tasks` table with RLS


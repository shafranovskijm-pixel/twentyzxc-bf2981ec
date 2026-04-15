

## Plan: Redesign admin panel layout (Syntagma-style)

### What changes

The admin panel gets a compact icon-only left sidebar (like the Syntagma example), a top header with a profile/settings dropdown menu in the top-right corner, and the site footer visible at the bottom.

### Layout structure

```text
┌──────┬─────────────────────────────────┐
│ Icon │  Header: Title    [🔔] [👤 ▾]  │
│ bar  ├─────────────────────────────────┤
│      │                                 │
│ 📊   │  Main content area              │
│ 📅   │                                 │
│ 📄   │                                 │
│ 👥   │                                 │
│ 📁   │                                 │
│      │                                 │
│ 🚪   ├─────────────────────────────────┤
│      │  Footer (site footer)           │
└──────┴─────────────────────────────────┘
```

### Sidebar (left, icon-only ~w-16)
Primary items always visible as icon buttons with tooltips:
- **Дашборд** (LayoutDashboard)
- **Планер** (CalendarDays)
- **Договоры** (FileText)
- **Клиенты** (Users)
- **Файлы** (FolderArchive)
- **Документы** (FileOutput)
- **Выйти** (LogOut) — at bottom

Active item highlighted with gold accent background, rounded. DND reordering preserved.

### Top-right dropdown menu (⋮ or avatar icon)
Secondary/settings items moved here:
- SEO
- Контакты
- Акции
- Реквизиты
- История
- НМО Портал
- ФИС ФРДО

### Footer
Import and render the site `<Footer />` component below the main content area so the admin always sees the brand footer.

### Files
- **Rewrite**: `src/components/admin/AdminSidebar.tsx` — compact icon-only sidebar with only primary items, always collapsed style
- **Edit**: `src/pages/Admin.tsx` — add dropdown menu in header for secondary items, add Footer below main content


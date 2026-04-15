

## Plan: Center sidebar menu, add header banner area, and profile/theme settings

### Changes

#### 1. Edit `src/components/admin/AdminSidebar.tsx`
- Center the nav items vertically in the sidebar (use `justify-center` on the nav container instead of `flex-1` top-aligned)
- Keep logo at top, logout at bottom, nav centered in between

#### 2. Edit `src/pages/Admin.tsx`
- **Header banner area**: Add a decorative banner strip above the header (gradient or uploadable background image placeholder). For now, a customizable gradient bar (~h-32) with a subtle pattern that can later support a background image upload
- **Profile/theme dropdown** in top-right: Replace the `MoreVertical` dropdown with two separate controls:
  - A profile/settings dropdown (`Settings` icon) containing: theme toggle (light/dark), and the secondary nav items (SEO, Contacts, Promotions, Requisites, History, NMO, FRDO)
  - Theme toggle using a `Sun`/`Moon` icon button that switches between light and dark mode via Tailwind's `dark` class on `<html>`
- Store theme preference in `localStorage`

#### 3. Theme implementation
- Add a simple theme toggler that sets `document.documentElement.classList.toggle('dark')` and persists to `localStorage` key `admin-theme`
- Default to dark (current state)

### Files
- **Edit**: `src/components/admin/AdminSidebar.tsx` — center nav vertically
- **Edit**: `src/pages/Admin.tsx` — add banner area, profile/theme toggle in header


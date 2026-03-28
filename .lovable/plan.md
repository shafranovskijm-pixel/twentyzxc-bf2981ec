

## Plan: Add Google Verification File + Create sitemap.xml

### 1. Copy Google verification file to `public/`
Copy `user-uploads://google4812de249c8bb9d5_4.html` → `public/google4812de249c8bb9d5.html` so it's served at `https://24zxc.ru/google4812de249c8bb9d5.html`.

### 2. Create `public/sitemap.xml`
Generate a sitemap with all public routes from the app (excluding `/admin`, `/p/:slug`, dynamic template previews):

- `/`
- `/portfolio`
- `/frdo`
- `/licensing`
- `/about`
- `/policy`
- `/templates`
- `/services/landing`
- `/services/corporate`
- `/services/ecommerce`
- `/services/webapp`
- `/services/nmo`
- `/projects/flowrish`
- `/projects/chmuleva`
- `/projects/lanmei`
- `/projects/lady-frost`
- `/projects/pr-nutrition`
- `/projects/status`
- `/projects/spinride`
- `/reviews`
- `/playground`

Base URL: `https://24zxc.ru`. Each entry gets `lastmod` set to today's date, priority based on page importance (1.0 for home, 0.8 for main sections, 0.6 for projects).

### 3. Update `public/robots.txt`
Add `Sitemap: https://24zxc.ru/sitemap.xml` and `Disallow: /admin`.

### Files
- **Copy**: Google verification HTML → `public/google4812de249c8bb9d5.html`
- **Create**: `public/sitemap.xml`
- **Edit**: `public/robots.txt`


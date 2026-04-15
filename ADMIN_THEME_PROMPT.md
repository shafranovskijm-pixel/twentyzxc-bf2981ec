# Admin Theme System — Design Transfer Guide

> Use this file as a prompt or reference when replicating the admin panel design system in another project.

---

## Architecture Overview

The admin panel uses a **theme system** with 6 pre-built visual themes. Each theme controls:
- Background gradient
- Header/card/sidebar styling
- Accent color (buttons, hover, active states)
- Animated particle/effect overlay
- Atmospheric banner "bleed" fragments in corners

---

## 1. Theme Data Structure (`admin-themes.ts`)

```typescript
export interface AdminTheme {
  id: string;
  label: string;
  emoji: string;
  bannerUrl: string;            // hero/banner image for the theme
  bgClass: string;              // Tailwind gradient for page background
  headerClass: string;          // header bar styling
  cardClass: string;            // card borders/backgrounds
  sidebarClass: string;         // sidebar styling
  accent: string;               // HSL values (e.g. "152 60% 45%") for --theme-accent
  accentForeground: string;     // HSL for text on accent
  animation: "leaves" | "fade" | "lights" | "gradient" | "glow" | "particles" | "sand" | "none";
  forceLight?: boolean;         // Override dark mode
  bannerPosition?: string;      // CSS object-position for banner
  previewPosition?: string;     // object-position for theme selector preview
  atmosphereBlur?: string;      // blur override for atmospheric fragments
  atmosphereOpacity?: number;   // opacity override
  atmosphereSharp?: boolean;    // enable a sharp (unblurred) layer
}
```

### Example themes:

| Theme | Accent HSL | Animation | Notes |
|-------|-----------|-----------|-------|
| Свежесть (Freshness) | 152 60% 45% | leaves (🍃 emoji) | forceLight, green gradient |
| Офис (Office) | 215 16% 42% | fade (pulsing) | forceLight, slate tones |
| Нью-Йорк (New York) | 38 92% 50% | lights (twinkling) | amber/warm, sharp right fragment |
| Закат (Sunset) | 25 95% 53% | sand (drifting particles) | orange warm tones |
| Минимализм | 270 60% 60% | glow (pulsing orbs) | violet/purple |
| Бирюза (Turquoise) | 170 80% 50% | particles (45 sparkles) | full gradient bg, dark text override |

---

## 2. How Buttons Change Color with Theme

**Key mechanism:** The active theme overrides `--primary` CSS variable via inline style on the root container.

```tsx
<div
  className={cn("min-h-screen flex w-full", activeTheme?.bgClass || "bg-background")}
  style={activeTheme ? {
    "--theme-accent": activeTheme.accent,
    "--theme-accent-foreground": activeTheme.accentForeground,
    "--primary": activeTheme.accent,                     // ← THIS is the magic
    "--primary-foreground": activeTheme.accentForeground, // ← buttons text color
  } as React.CSSProperties : undefined}
>
```

Since all shadcn buttons use `bg-primary`, `hover:bg-primary/10`, `text-primary`, etc., overriding `--primary` instantly recolors **everything** — buttons, active states, hover effects, sidebar highlights.

---

## 3. Atmospheric Banner Bleed

Banner images "bleed" into page corners through multiple `<img>` layers with CSS masks:

```tsx
{/* Bottom-right — main blurred fragment */}
<img
  src={bannerUrl || activeTheme.bannerUrl}
  className="absolute -bottom-8 -right-8 w-[55%] h-[50%] object-cover"
  style={{
    opacity: 0.18,
    filter: 'blur(20px) saturate(1.4)',
    maskImage: 'radial-gradient(ellipse at 100% 100%, black 20%, transparent 75%)',
    WebkitMaskImage: 'radial-gradient(ellipse at 100% 100%, black 20%, transparent 75%)',
  }}
/>

{/* Bottom-right — sharp (clear) layer */}
<img
  src={bannerUrl || activeTheme.bannerUrl}
  className="absolute -bottom-8 -right-8 w-[55%] h-[50%] object-cover"
  style={{
    opacity: 0.3,
    filter: 'blur(0px) saturate(1.6)',
    maskImage: 'radial-gradient(ellipse at 100% 100%, black 15%, transparent 55%)',
  }}
/>

{/* Bottom-left — secondary bleed */}
<img
  src={bannerUrl || activeTheme.bannerUrl}
  className="absolute -bottom-10 -left-10 w-[45%] h-[45%] object-cover opacity-[0.14]"
  style={{
    filter: 'blur(25px) saturate(1.3)',
    maskImage: 'radial-gradient(ellipse at 0% 100%, black 15%, transparent 70%)',
  }}
/>

{/* Right edge mid — side glow */}
<img
  src={bannerUrl || activeTheme.bannerUrl}
  className="absolute top-1/4 -right-4 w-[30%] h-[40%] object-cover"
  style={{
    opacity: 0.10,
    filter: 'blur(30px) saturate(1.2)',
    maskImage: 'radial-gradient(ellipse at 100% 50%, black 10%, transparent 65%)',
  }}
/>

{/* Footer zone — wide horizontal strip */}
<img
  src={bannerUrl || activeTheme.bannerUrl}
  className="absolute -bottom-4 left-[10%] w-[80%] h-[25%] object-cover opacity-[0.15]"
  style={{
    filter: 'blur(20px) saturate(1.3)',
    maskImage: 'linear-gradient(to top, black 10%, transparent 85%)',
  }}
/>
```

### Special per-theme overrides:
- **Freshness/Turquoise/Minimalism/Sunset**: Sharp layer uses full-width `linear-gradient(to top, ...)` instead of radial
- **New York**: Right-edge fragment uses `maskComposite: 'intersect'` to smoothly fade the left edge while keeping the right side sharp and opaque (0.42)

---

## 4. Theme Animations (`ThemeAnimations.tsx`)

Seven animation types, all rendered as `fixed inset-0 pointer-events-none z-0`:

| Animation | Component | Technique |
|-----------|-----------|-----------|
| `leaves` | LeavesAnimation | 12 falling 🍃 emojis with random drift |
| `fade` | FadeAnimation | Single pulsing gradient overlay |
| `lights` | LightsAnimation | 20 twinkling amber dots |
| `gradient` | GradientAnimation | Shifting gradient + floating blur orb |
| `glow` | GlowAnimation | Two pulsing violet blur orbs |
| `particles` | ParticlesAnimation | 45 layered sparkles (large drops + medium + dust) |
| `sand` | SandAnimation | 30 drifting amber/orange grains |

All use `framer-motion` with `useMemo` for particle positions and `Infinity` repeat transitions.

---

## 5. Banner Display Modes (Custom Upload)

Users can upload a custom banner with 4 display modes:
- **Заполнить** (`cover`) — `object-fit: cover` (default)
- **Вписать** (`contain`) — `object-fit: contain` with black background
- **Замостить** (`tile`) — `background-repeat: repeat; background-size: auto`
- **Растянуть** (`stretch`) — `object-fit: fill`

Persisted in `localStorage("admin-banner-fit")`.

---

## 6. Footer Localized Blur

The footer uses a local blur effect to ensure readability over atmospheric fragments:

```tsx
<div className="relative">
  {activeTheme && (
    <div className="absolute inset-0 backdrop-blur-md bg-background/40 rounded-t-2xl -z-10" />
  )}
  <Footer />
</div>
```

---

## 7. Turquoise Special Handling

The Turquoise theme is unique — it uses an inline `background` gradient instead of `bgClass` and overrides foreground colors for contrast:

```tsx
...(activeTheme.id === 'turquoise' ? {
  background: 'linear-gradient(to bottom, #d4f5ef 0%, #8fd8ca 12%, #4db8a8 25%, #2a8a80 40%, #1a5a58 55%, #0f3a3e 70%, #0c2a30 85%, #050e12 100%)',
  "--foreground": "180 10% 10%",
  "--muted-foreground": "180 8% 25%",
} : {}),
```

---

## 8. Implementation Checklist for New Project

1. **Install dependencies**: `framer-motion`, `class-variance-authority`, shadcn/ui components
2. **Create `admin-themes.ts`** with theme definitions and banner images
3. **Create `ThemeAnimations.tsx`** with all 7 animation components
4. **Add theme state** in your admin layout: `activeTheme`, `isDark`, `bannerUrl`, `bannerFit`
5. **Apply inline style** on root div: override `--primary` and `--primary-foreground` from theme
6. **Add atmospheric bleed section**: fixed positioned masked banner images
7. **Add footer blur overlay** when theme is active
8. **Add theme selector UI**: grid of theme preview cards with banner thumbnails
9. **Add banner upload**: file input with fit mode toggles (cover/contain/tile/stretch)
10. **Persist in localStorage**: theme ID, dark/light mode, banner URL, banner fit mode

---

## Quick Start Prompt

> "Create an admin panel with a theme system. The panel has a sidebar, header, and main content area. Add 6 visual themes (Freshness/green, Office/slate, New York/amber, Sunset/orange, Minimalism/violet, Turquoise/teal). Each theme has: a banner image, background gradient, accent color that overrides --primary CSS variable for all buttons/hover states, animated particle overlay (leaves/lights/glow/sand/particles/fade), and atmospheric banner 'bleed' fragments in corners using CSS radial-gradient masks with blur and saturate filters. Include a theme selector grid with preview cards, light/dark mode toggle, custom banner upload with cover/contain/tile/stretch modes. Use framer-motion for animations, shadcn/ui for components, Tailwind CSS for styling."

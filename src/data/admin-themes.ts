import bannerFreshness from "@/assets/banners/banner-freshness.jpg";
import bannerOffice from "@/assets/banners/banner-office.jpg";
import bannerNewyork from "@/assets/banners/banner-newyork.jpg";
import bannerSunset from "@/assets/banners/banner-sunset.jpg";
import bannerMinimalism from "@/assets/banners/banner-minimalism.jpg";

export interface AdminTheme {
  id: string;
  label: string;
  emoji: string;
  bannerUrl: string;
  /** CSS classes for the main layout background */
  bgClass: string;
  /** CSS classes for the header bar */
  headerClass: string;
  /** CSS classes for cards */
  cardClass: string;
  /** CSS classes for the sidebar */
  sidebarClass: string;
  /** HSL accent color (without hsl() wrapper) for --theme-accent */
  accent: string;
  /** HSL accent foreground */
  accentForeground: string;
  /** Animation id */
  animation: "leaves" | "fade" | "lights" | "gradient" | "glow" | "none";
  /** Force light mode regardless of user preference */
  forceLight?: boolean;
}

export const adminThemes: AdminTheme[] = [
  {
    id: "freshness",
    label: "Свежесть",
    emoji: "🍉",
    bannerUrl: bannerFreshness,
    bgClass: "bg-gradient-to-br from-emerald-50/80 via-white to-green-50/60 dark:from-[#0f1a14] dark:via-[#111916] dark:to-[#0d1510]",
    headerClass: "bg-white/90 dark:bg-[#111916]/95 border-emerald-200/50 dark:border-emerald-900/30",
    cardClass: "border-emerald-200/40 dark:border-emerald-900/30 bg-white/80 dark:bg-[#111916]/80",
    sidebarClass: "bg-white/95 dark:bg-[#0f1a14]/95 border-emerald-200/50 dark:border-emerald-900/30",
    accent: "152 60% 45%",
    accentForeground: "0 0% 100%",
    animation: "leaves",
    forceLight: true,
  },
  {
    id: "office",
    label: "Офис",
    emoji: "🏢",
    bannerUrl: bannerOffice,
    bgClass: "bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-[#14161a] dark:via-[#16181c] dark:to-[#12141a]",
    headerClass: "bg-white/90 dark:bg-[#16181c]/95 border-slate-200/60 dark:border-slate-700/40",
    cardClass: "border-slate-200/50 dark:border-slate-700/30 bg-white/80 dark:bg-[#16181c]/80",
    sidebarClass: "bg-white/95 dark:bg-[#14161a]/95 border-slate-200/50 dark:border-slate-700/40",
    accent: "215 16% 42%",
    accentForeground: "0 0% 100%",
    animation: "fade",
    forceLight: true,
  },
  {
    id: "newyork",
    label: "Нью-Йорк",
    emoji: "🌆",
    bannerUrl: bannerNewyork,
    bgClass: "bg-gradient-to-br from-stone-100 via-zinc-50 to-amber-50/30 dark:from-[#18160f] dark:via-[#1a1810] dark:to-[#15130e]",
    headerClass: "bg-white/90 dark:bg-[#1a1810]/95 border-amber-200/40 dark:border-amber-900/30",
    cardClass: "border-amber-200/30 dark:border-amber-900/25 bg-white/80 dark:bg-[#1a1810]/80",
    sidebarClass: "bg-white/95 dark:bg-[#18160f]/95 border-amber-200/40 dark:border-amber-900/30",
    accent: "38 92% 50%",
    accentForeground: "0 0% 8%",
    animation: "lights",
  },
  {
    id: "sunset",
    label: "Закат",
    emoji: "🌅",
    bannerUrl: bannerSunset,
    bgClass: "bg-gradient-to-br from-orange-50/70 via-rose-50/30 to-amber-50/50 dark:from-[#1a130e] dark:via-[#1a1010] dark:to-[#18140e]",
    headerClass: "bg-white/90 dark:bg-[#1a130e]/95 border-orange-200/40 dark:border-orange-900/30",
    cardClass: "border-orange-200/30 dark:border-orange-900/25 bg-white/80 dark:bg-[#1a130e]/80",
    sidebarClass: "bg-white/95 dark:bg-[#1a130e]/95 border-orange-200/40 dark:border-orange-900/30",
    accent: "25 95% 53%",
    accentForeground: "0 0% 100%",
    animation: "gradient",
  },
  {
    id: "minimalism",
    label: "Минимализм",
    emoji: "🌿",
    bannerUrl: bannerMinimalism,
    bgClass: "bg-gradient-to-br from-violet-50/60 via-purple-50/30 to-fuchsia-50/20 dark:from-[#16121a] dark:via-[#181420] dark:to-[#14101a]",
    headerClass: "bg-white/90 dark:bg-[#16121a]/95 border-violet-200/40 dark:border-violet-900/30",
    cardClass: "border-violet-200/30 dark:border-violet-900/25 bg-white/80 dark:bg-[#16121a]/80",
    sidebarClass: "bg-white/95 dark:bg-[#16121a]/95 border-violet-200/40 dark:border-violet-900/30",
    accent: "270 60% 60%",
    accentForeground: "0 0% 100%",
    animation: "glow",
  },
];

export const THEME_STORAGE_KEY = "admin-active-theme";

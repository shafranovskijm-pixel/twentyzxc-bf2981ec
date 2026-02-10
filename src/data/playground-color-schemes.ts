import { PlaygroundBlock } from "./playground-effects";

export interface ColorScheme {
  id: string;
  name: string;
  description: string;
  preview: string; // CSS gradient for preview swatch
  background: string;
  heading: string;
  headingGradient?: string;
  text: string;
  accent: string;
  cardBg: string;
  cardBorder: string;
  navbarBg: string;
  footerBg: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Глубокий синий + голубые акценты',
    preview: 'linear-gradient(135deg, #0d1b2a, #1b2838, #38bdf8)',
    background: '#0d1b2a',
    heading: '#e2e8f0',
    headingGradient: 'linear-gradient(135deg, #38bdf8, #7dd3fc)',
    text: '#94a3b8',
    accent: '#38bdf8',
    cardBg: '#131c33',
    cardBorder: 'rgba(56,189,248,0.15)',
    navbarBg: '#0a1628',
    footerBg: '#080e1a',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Тёмно-зелёный + изумруд',
    preview: 'linear-gradient(135deg, #0a1a0f, #132a1a, #22c55e)',
    background: '#0a1a0f',
    heading: '#d1fae5',
    headingGradient: 'linear-gradient(135deg, #22c55e, #4ade80)',
    text: '#6ee7b7',
    accent: '#22c55e',
    cardBg: '#132a1a',
    cardBorder: 'rgba(34,197,94,0.15)',
    navbarBg: '#071510',
    footerBg: '#050e08',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Бордовый + оранжевые акценты',
    preview: 'linear-gradient(135deg, #1a0a0a, #2a1111, #f97316)',
    background: '#1a0a0a',
    heading: '#fde68a',
    headingGradient: 'linear-gradient(135deg, #f97316, #fb923c, #fbbf24)',
    text: '#d6b99a',
    accent: '#f97316',
    cardBg: '#2a1111',
    cardBorder: 'rgba(249,115,22,0.15)',
    navbarBg: '#140808',
    footerBg: '#0a0505',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Фиолетовый + лаванда',
    preview: 'linear-gradient(135deg, #0f0a1a, #1e1b2e, #a855f7)',
    background: '#0f0a1a',
    heading: '#e9d5ff',
    headingGradient: 'linear-gradient(135deg, #a855f7, #c084fc)',
    text: '#c4b5fd',
    accent: '#a855f7',
    cardBg: '#1e1b2e',
    cardBorder: 'rgba(168,85,247,0.15)',
    navbarBg: '#0a0814',
    footerBg: '#07050e',
  },
  {
    id: 'warm-gold',
    name: 'Warm Gold',
    description: 'Чёрный + золотые акценты',
    preview: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #d4a855)',
    background: '#0a0a0a',
    heading: '#fef3c7',
    headingGradient: 'linear-gradient(135deg, #d4a855, #e8d5a0, #d4a855)',
    text: '#a89070',
    accent: '#d4a855',
    cardBg: '#1a1510',
    cardBorder: 'rgba(212,168,85,0.15)',
    navbarBg: '#0a0a0a',
    footerBg: '#050505',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Холодный серый + белые акценты',
    preview: 'linear-gradient(135deg, #111118, #1c1c24, #e2e8f0)',
    background: '#111118',
    heading: '#f1f5f9',
    text: '#94a3b8',
    accent: '#cbd5e1',
    cardBg: '#1c1c24',
    cardBorder: 'rgba(148,163,184,0.12)',
    navbarBg: '#0d0d14',
    footerBg: '#08080e',
  },
];

export function applyColorScheme(blocks: PlaygroundBlock[], scheme: ColorScheme): PlaygroundBlock[] {
  return blocks.map(block => {
    const updated = { ...block, styles: { ...block.styles } };
    
    switch (block.type) {
      case 'heading':
        updated.styles.textColor = scheme.heading;
        if (scheme.headingGradient) {
          updated.styles.gradientText = scheme.headingGradient;
        }
        break;
      case 'text':
        updated.styles.textColor = scheme.text;
        break;
      case 'card':
        updated.styles.backgroundColor = scheme.cardBg;
        updated.styles.borderColor = scheme.cardBorder;
        updated.styles.textColor = scheme.text;
        break;
      case 'button':
        updated.styles.textColor = scheme.accent;
        break;
      case 'navbar':
        updated.styles.backgroundColor = scheme.navbarBg;
        updated.styles.textColor = scheme.text;
        break;
      case 'footer':
        updated.styles.backgroundColor = scheme.footerBg;
        updated.styles.textColor = scheme.text;
        break;
      case 'counter':
      case 'icon-text':
        updated.styles.textColor = scheme.accent;
        if (block.styles.backgroundColor && block.styles.backgroundColor !== 'transparent') {
          updated.styles.backgroundColor = scheme.cardBg;
        }
        break;
      case 'columns':
      case 'accordion':
      case 'tabs':
      case 'form':
        if (block.styles.backgroundColor && block.styles.backgroundColor !== 'transparent') {
          updated.styles.backgroundColor = scheme.cardBg;
          updated.styles.borderColor = scheme.cardBorder;
        }
        updated.styles.textColor = scheme.text;
        break;
      case 'quote':
        updated.styles.textColor = scheme.accent;
        break;
      case 'divider':
        updated.styles.textColor = scheme.cardBorder;
        break;
      case 'countdown':
        updated.styles.textColor = scheme.accent;
        break;
      default:
        break;
    }
    
    return updated;
  });
}

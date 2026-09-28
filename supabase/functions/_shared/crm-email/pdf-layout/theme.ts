// 24ZXC PDF design tokens. Mirrors the existing HTML template palette so the
// vector PDF stays visually consistent with the browser preview.
export const COLORS = {
  darkBar: "#15171e",
  darkPanel: "#1b1f29",
  gold: "#d4be37",
  goldSoft: "#f5e9a8",
  warmBg: "#faf8ef",
  sectionRule: "#ede9d8",
  text: "#15171e",
  muted: "#5a5a63",
  faint: "#a0a0a8",
  paperFooter: "#8a8a93",
  invert: "#f5f5f0",
};

export const PAGE = {
  size: "A4" as const,
  // top/right/bottom/left in pt (1mm ≈ 2.8346pt). Body area sits between the
  // native header bar (~14mm) and the footer with page numbers (~12mm).
  margins: [48, 62, 48, 52] as [number, number, number, number],
};

export const STYLES = {
  h1: { fontSize: 20, bold: false, color: COLORS.text, alignment: "center", margin: [0, 4, 0, 8] },
  h2: { fontSize: 10, bold: true, color: COLORS.text, characterSpacing: 1.4, margin: [0, 14, 0, 6] },
  h3: { fontSize: 10.5, bold: true, color: COLORS.text, margin: [0, 8, 0, 4] },
  kicker: { fontSize: 8, color: COLORS.gold, characterSpacing: 3, alignment: "center", bold: true, margin: [0, 4, 0, 0] },
  meta: { fontSize: 10, color: COLORS.muted, margin: [0, 6, 0, 10] },
  body: { fontSize: 10, color: COLORS.text, lineHeight: 1.35, margin: [0, 2, 0, 2] },
  small: { fontSize: 9, color: COLORS.muted },
  tableHeader: { fontSize: 8.5, bold: true, color: COLORS.invert, characterSpacing: 1 },
  tableCell: { fontSize: 10, color: COLORS.text },
  bankCell: { fontSize: 9.5, color: COLORS.text },
  signature: { fontSize: 9.5, color: COLORS.text, lineHeight: 1.4 },
};
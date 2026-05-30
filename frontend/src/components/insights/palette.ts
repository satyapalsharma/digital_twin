// Concrete colors for Recharts (CSS vars are stored as HSL triples, which
// Recharts can't consume directly). Kept in sync with globals.css tokens.
export const PRIMARY = "#D97757";
export const SUCCESS = "#2D8659";
export const WARNING = "#D9A441";
export const DESTRUCTIVE = "#C7453C";
export const MUTED = "#A8A29C";
export const BORDER = "#E8E2DA";
export const AXIS = "#6B655D";

export const TOOLTIP_STYLE = {
  borderRadius: 6,
  border: `1px solid ${BORDER}`,
  fontSize: 12,
} as const;

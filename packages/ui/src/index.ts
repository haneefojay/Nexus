export const nexusTokens = {
  color: {
    canvas: "#070A09",
    surface: "#0C100E",
    text: "#E9EEE9",
    muted: "#8A9690",
    signal: "#B9F227",
    attention: "#F5A742",
    critical: "#FF6B57",
  },
  radius: { control: "6px", panel: "8px" },
  motion: {
    expressiveEase: [0.22, 1, 0.36, 1] as const,
    fast: 160,
    standard: 240,
    deliberate: 420,
  },
} as const;

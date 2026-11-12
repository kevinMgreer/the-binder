const PATHS = {
  gear: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  dashboard: "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
  plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z",
  cards: "M7 19h10V4H7v15zM2 17h4V6H2v11zM18 6v11h4V6h-4z",
  camera: "M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
} as const;

/** Inline icons in `currentColor`. `outline` draws the same shape as a stroke, so a solid icon next to an outline one differs in shape, not only in colour. */
export function Icon({ name, outline = false }: { name: keyof typeof PATHS; outline?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill={outline ? "none" : "currentColor"} aria-hidden="true" focusable="false" data-variant={outline ? "outline" : "solid"}>
      <path d={PATHS[name]} {...(outline ? { stroke: "currentColor", strokeWidth: 1.6, strokeLinejoin: "round" as const } : {})} />
    </svg>
  );
}

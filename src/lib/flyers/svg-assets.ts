/** SVG assets encoded for Satori (img + backgroundImage). */

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const GEOMETRIC_PATTERN_BG = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="#0A1A2F"/>
  <g fill="none" stroke="#132743" stroke-width="0.8">
    <path d="M40 4 L48 16 L62 16 L52 26 L56 40 L40 32 L24 40 L28 26 L18 16 L32 16 Z"/>
    <path d="M4 40 L16 32 L16 18 L26 28 L40 24 L32 40 L40 56 L26 52 L16 62 L16 48 Z"/>
    <path d="M76 40 L64 48 L64 62 L54 52 L40 56 L48 40 L40 24 L54 28 L64 18 L64 32 Z"/>
    <path d="M40 76 L32 64 L18 64 L28 54 L24 40 L40 48 L56 40 L52 54 L62 64 L48 64 Z"/>
  </g>
</svg>`);

export const ORNATE_PATTERN_PURPLE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#2D1B4E"/>
  <g fill="none" stroke="#3D2860" stroke-width="0.6">
    <circle cx="50" cy="50" r="18"/>
    <circle cx="50" cy="50" r="8"/>
    <path d="M50 10 L54 22 L66 22 L56 30 L60 42 L50 34 L40 42 L44 30 L34 22 L46 22 Z"/>
    <path d="M90 50 L78 46 L78 34 L70 44 L58 40 L66 50 L58 60 L70 56 L78 66 L78 54 Z"/>
    <path d="M50 90 L46 78 L34 78 L44 70 L40 58 L50 66 L60 58 L56 70 L66 78 L54 78 Z"/>
    <path d="M10 50 L22 54 L22 66 L30 56 L42 60 L34 50 L42 40 L30 44 L22 34 L22 46 Z"/>
  </g>
</svg>`);

export const MOSQUE_SILHOUETTE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="200" viewBox="0 0 420 200">
  <g fill="#D4AF37">
    <ellipse cx="210" cy="178" rx="190" ry="14"/>
    <rect x="60" y="95" width="300" height="78" rx="4"/>
    <path d="M130 95 L130 55 Q130 28 155 28 Q180 28 180 55 L180 95 Z"/>
    <path d="M240 95 L240 55 Q240 28 265 28 Q290 28 290 55 L290 95 Z"/>
    <rect x="188" y="62" width="44" height="33" rx="2"/>
    <path d="M195 95 L195 38 Q210 8 225 38 L225 95 Z"/>
    <circle cx="210" cy="22" r="10"/>
    <path d="M204 18 Q210 6 216 18" fill="none" stroke="#D4AF37" stroke-width="2"/>
    <rect x="95" y="108" width="22" height="52" rx="2"/>
    <rect x="303" y="108" width="22" height="52" rx="2"/>
    <rect x="40" y="72" width="18" height="101" rx="2"/>
    <rect x="362" y="72" width="18" height="101" rx="2"/>
    <rect x="46" y="58" width="6" height="115"/>
    <rect x="368" y="58" width="6" height="115"/>
    <circle cx="49" cy="52" r="8"/>
    <circle cx="371" cy="52" r="8"/>
    <rect x="155" y="118" width="28" height="42" rx="14"/>
    <rect x="237" y="118" width="28" height="42" rx="14"/>
    <rect x="192" y="118" width="36" height="48" rx="3"/>
  </g>
</svg>`);

export const ARCH_FRAME = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="920" height="280" viewBox="0 0 920 280">
  <path d="M20 270 L20 120 Q460 10 900 120 L900 270" fill="none" stroke="#D4AF37" stroke-width="3"/>
  <path d="M36 270 L36 128 Q460 34 884 128 L884 270" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.65"/>
</svg>`);

export const CRESCENT_MOON = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="38" fill="#D4AF37"/>
  <circle cx="72" cy="52" r="32" fill="#2D1B4E"/>
</svg>`);

export const LANTERN = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="140" viewBox="0 0 80 140">
  <g fill="#D4AF37">
    <rect x="34" y="0" width="12" height="18" rx="2"/>
    <path d="M18 18 H62 L58 48 H22 Z"/>
    <rect x="22" y="48" width="36" height="58" rx="6"/>
    <path d="M26 106 H54 L50 130 H30 Z"/>
    <rect x="36" y="130" width="8" height="10" rx="1"/>
    <rect x="28" y="58" width="24" height="6" rx="1" fill="#2D1B4E" opacity="0.35"/>
    <rect x="28" y="72" width="24" height="6" rx="1" fill="#2D1B4E" opacity="0.35"/>
  </g>
</svg>`);

export const STAR_SPARKLE = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path fill="#D4AF37" d="M12 0 L13.5 8.5 L22 10 L13.5 11.5 L12 20 L10.5 11.5 L2 10 L10.5 8.5 Z"/>
</svg>`);

function iconSvg(paths: string) {
  return svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 56 56">
  <g fill="none" stroke="#D4AF37" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    ${paths}
  </g>
</svg>`);
}

export const ICON_ZAKAH = iconSvg(`
  <path d="M18 24 C18 18 22 14 28 14 C34 14 38 18 38 24"/>
  <path d="M14 24 H42"/>
  <path d="M22 24 V34 C22 38 24 40 28 40 C32 40 34 38 34 34 V24"/>
  <circle cx="28" cy="46" r="4" fill="#D4AF37" stroke="none"/>
`);

export const ICON_SADAQAH = iconSvg(`
  <path d="M28 46 C18 36 14 28 18 22 C22 16 28 18 28 24 C28 18 34 16 38 22 C42 28 38 36 28 46 Z" fill="#D4AF37" stroke="none"/>
`);

export const ICON_FITRAH = iconSvg(`
  <ellipse cx="28" cy="38" rx="16" ry="8"/>
  <path d="M16 38 Q28 22 40 38"/>
  <path d="M22 30 Q28 26 34 30" opacity="0.6"/>
`);

export const ICON_DEVELOPMENT = iconSvg(`
  <path d="M20 40 V24 L28 18 L36 24 V40"/>
  <path d="M16 40 H40"/>
  <path d="M28 14 V10 M24 12 H32"/>
  <circle cx="28" cy="8" r="3" fill="#D4AF37" stroke="none"/>
`);

export const ICON_RAMADAN = iconSvg(`
  <path d="M14 22 A14 14 0 1 1 28 22 A11 11 0 1 0 14 22"/>
  <path d="M36 18 L36 38 M32 22 H40 M32 30 H40"/>
`);

export const ICON_DAWAH = iconSvg(`
  <path d="M16 14 H36 V42 H16 Z"/>
  <path d="M20 20 H32 M20 26 H32 M20 32 H28"/>
`);

export const ICON_IFTAR = iconSvg(`
  <ellipse cx="28" cy="36" rx="14" ry="7"/>
  <path d="M16 36 Q28 24 40 36"/>
  <path d="M36 20 L40 28 L32 28 Z" fill="#D4AF37" stroke="none"/>
`);

export const ICON_TARAWEEH = iconSvg(`
  <path d="M18 40 V26 L28 18 L38 26 V40"/>
  <path d="M14 40 H42"/>
  <path d="M24 32 H32 M24 36 H32"/>
  <path d="M28 12 V8 M25 10 H31"/>
`);

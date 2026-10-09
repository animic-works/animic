import { pickArt } from "../art-preview";
import type { ArtFeatures } from "../art-features";
function artSvg(f: ArtFeatures) {
  const hair = pickArt("hair", f.hair);
  const eye = pickArt("eyes", f.eyes).color;
  const outfit = pickArt("outfit", f.outfit);
  const skin = "#ffe4d4";
  const ink = "#2b2f45";
  const backgrounds: Record<string, string> = {
    white: '<rect width="200" height="200" fill="#ffffff"/>',
    sky: '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#e9f7ff"/></linearGradient></defs><rect width="200" height="200" fill="url(#sky)"/><ellipse cx="46" cy="52" rx="26" ry="9" fill="#fff" opacity=".9"/><ellipse cx="160" cy="36" rx="20" ry="7" fill="#fff" opacity=".85"/>',
    room: '<rect width="200" height="200" fill="#f6ead3"/><rect x="118" y="18" width="64" height="70" rx="4" fill="#cfeaff" stroke="#c9a978" stroke-width="5"/><line x1="150" y1="18" x2="150" y2="88" stroke="#c9a978" stroke-width="4"/><rect x="0" y="150" width="200" height="50" fill="#e3cfa9"/>',
  };
  const bg = backgrounds[f.bg] ?? backgrounds.white;
  const backs: Record<string, string> = {
    twin: `<ellipse cx="44" cy="120" rx="20" ry="46" fill="${hair.color}" transform="rotate(14 44 120)"/><ellipse cx="156" cy="120" rx="20" ry="46" fill="${hair.color}" transform="rotate(-14 156 120)"/><circle cx="58" cy="70" r="7" fill="#ff5c9b"/><circle cx="142" cy="70" r="7" fill="#ff5c9b"/>`,
    bob: `<path d="M52 92 Q52 44 100 44 Q148 44 148 92 L150 132 Q126 140 100 138 Q74 140 50 132 Z" fill="${hair.color}"/>`,
    long: `<path d="M50 92 Q50 42 100 42 Q150 42 150 92 L156 190 L44 190 Z" fill="${hair.color}"/>`,
  };
  const back = backs[f.style] ?? backs.twin;
  const outfits: Record<string, string> = {
    sailor: `<path d="M44 200 Q48 150 100 146 Q152 150 156 200 Z" fill="${outfit.color}"/><path d="M70 150 L100 178 L130 150 Q116 146 100 146 Q84 146 70 150 Z" fill="#fff"/><path d="M92 170 L100 186 L108 170 L100 164 Z" fill="#e8414f"/>`,
    hoodie: `<path d="M40 200 Q46 146 100 142 Q154 146 160 200 Z" fill="${outfit.color}"/><path d="M68 150 Q100 170 132 150" fill="none" stroke="#7f8894" stroke-width="5"/><line x1="92" y1="160" x2="90" y2="186" stroke="#fff" stroke-width="3"/><line x1="108" y1="160" x2="110" y2="186" stroke="#fff" stroke-width="3"/>`,
    dress: `<path d="M46 200 Q52 150 100 146 Q148 150 154 200 Z" fill="${outfit.color}"/><path d="M78 150 Q100 166 122 150" fill="none" stroke="#fff" stroke-width="4"/>`,
  };
  const clothes = outfits[f.outfit] ?? outfits.sailor;
  const eyes =
    f.face === "wink"
      ? `<ellipse cx="82" cy="104" rx="8" ry="11" fill="${eye}"/><circle cx="84" cy="100" r="3" fill="#fff"/><path d="M110 104 Q118 98 126 104" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`
      : `<ellipse cx="82" cy="104" rx="8" ry="11" fill="${eye}"/><ellipse cx="118" cy="104" rx="8" ry="11" fill="${eye}"/><circle cx="84" cy="100" r="3" fill="#fff"/><circle cx="120" cy="100" r="3" fill="#fff"/>`;
  const mouth =
    f.face === "calm"
      ? `<line x1="94" y1="126" x2="106" y2="126" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M91 122 Q100 132 109 122" fill="#ff8a8a" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 200 200" role="img" aria-label="" xmlns="http://www.w3.org/2000/svg">
    ${bg}
    ${back}
    ${clothes}
    <rect x="90" y="128" width="20" height="22" fill="${skin}"/>
    <circle cx="100" cy="98" r="40" fill="${skin}"/>
    <path d="M58 96 Q56 50 100 50 Q144 50 142 96 Q132 76 118 72 Q112 84 96 80 Q88 90 72 86 Q64 92 58 96 Z" fill="${hair.color}"/>
    <path d="M72 58 Q100 46 128 58" fill="none" stroke="${hair.shade}" stroke-width="4" stroke-linecap="round" opacity=".6"/>
    ${eyes}
    <ellipse cx="72" cy="118" rx="7" ry="4" fill="#ff9fbe" opacity=".7"/>
    <ellipse cx="128" cy="118" rx="7" ry="4" fill="#ff9fbe" opacity=".7"/>
    ${mouth}
  </svg>`;
}

export function artImage(features: ArtFeatures, crop = false) {
  const svg = artSvg(features);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(crop ? svg.replace('viewBox="0 0 200 200"', 'viewBox="35 35 130 130"') : svg)}`;
}

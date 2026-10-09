import { artFeatures, artKeys, artTopic, type ArtKey, type ArtFeatures } from "./art-features";
export function artRandom(seed: string) {
  let s = Array.from(seed).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261) || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
export function artFromPrompt(prompt: string, seed: string) {
  const text = prompt.toLowerCase(),
    random = artRandom(seed);
  const features = { ...artTopic };
  for (const key of artKeys) {
    const options = artFeatures[key];
    features[key] = (
      options.find((o) => o.words.some((w) => text.includes(w.toLowerCase()))) ??
      options[Math.floor(random() * options.length)]
    ).id;
  }
  return features;
}
export function artSimilarity(features: ArtFeatures, seed: string) {
  const random = artRandom(`${seed}-sim`);
  const weights = { hair: 12, style: 10, eyes: 7, outfit: 9, face: 6, bg: 8 };
  const score = artKeys.reduce(
    (value, key) => value + (features[key] === artTopic[key] ? weights[key] : 0),
    38,
  );
  return Math.min(98.9, Math.round((score + random() * 6) * 10) / 10);
}
export function pickArt(key: ArtKey, id: string) {
  return artFeatures[key].find((o) => o.id === id) ?? artFeatures[key][0];
}
export function decodeArt(value: string) {
  const parts = value.split(".");
  const features = { ...artTopic };
  artKeys.forEach((key, i) => {
    if (artFeatures[key].some((o) => o.id === parts[i])) features[key] = parts[i];
  });
  return features;
}
export function encodeArt(features: ArtFeatures) {
  return artKeys.map((key) => features[key]).join(".");
}
export function artTags(features: ArtFeatures) {
  return [
    "1girl",
    "solo",
    ...artKeys.map((key) => pickArt(key, features[key]).tag),
    "looking at viewer",
  ];
}

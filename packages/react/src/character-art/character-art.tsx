import { artImage } from "@animic/styled-system/recipes";

// キャラクターの挿絵。プロンプトの言葉から髪・目・服・表情・背景を決めてSVGで描く。
// 画像生成の代わりの仮の絵で、お題の挿絵や生成サービスをつなぐ前の表示に使う

export type ArtFeatureKey = "hair" | "style" | "eyes" | "outfit" | "face" | "bg";
export type ArtFeatures = Record<ArtFeatureKey, string>;

type Option = {
  id: string;
  label: string;
  tag: string;
  words: string[];
  color?: string;
  shade?: string;
};

// 特徴ごとの選択肢。words は文章・Danbooruタグのどちらでも拾えるようにする
export const ART_FEATURES: Record<ArtFeatureKey, Option[]> = {
  hair: [
    {
      id: "pink",
      label: "ピンクの髪",
      tag: "pink hair",
      words: ["ピンク", "pink hair"],
      color: "#ff8fc6",
      shade: "#ec5fa6",
    },
    {
      id: "blonde",
      label: "金髪",
      tag: "blonde hair",
      words: ["金髪", "blonde"],
      color: "#ffd65c",
      shade: "#e9b52c",
    },
    {
      id: "black",
      label: "黒髪",
      tag: "black hair",
      words: ["黒髪", "black hair"],
      color: "#3a3f55",
      shade: "#23273a",
    },
    {
      id: "blue",
      label: "青い髪",
      tag: "blue hair",
      words: ["青い髪", "青髪", "blue hair"],
      color: "#6fc3ff",
      shade: "#3a9be0",
    },
    {
      id: "silver",
      label: "銀髪",
      tag: "silver hair",
      words: ["銀髪", "白髪", "silver hair", "white hair"],
      color: "#dfe4ee",
      shade: "#b7bfcf",
    },
  ],
  style: [
    {
      id: "twin",
      label: "ツインテール",
      tag: "twintails",
      words: ["ツインテ", "twintails", "twin tails"],
    },
    {
      id: "bob",
      label: "ボブ",
      tag: "bob cut",
      words: ["ボブ", "bob cut", "short hair", "ショート"],
    },
    { id: "long", label: "ロングヘア", tag: "long hair", words: ["ロング", "long hair"] },
  ],
  eyes: [
    {
      id: "blue",
      label: "青い目",
      tag: "blue eyes",
      words: ["青い目", "青い瞳", "blue eyes"],
      color: "#2f8fe8",
    },
    {
      id: "red",
      label: "赤い目",
      tag: "red eyes",
      words: ["赤い目", "赤い瞳", "red eyes"],
      color: "#e8414f",
    },
    {
      id: "green",
      label: "緑の目",
      tag: "green eyes",
      words: ["緑の目", "緑の瞳", "green eyes"],
      color: "#2fb07a",
    },
  ],
  outfit: [
    {
      id: "sailor",
      label: "セーラー服",
      tag: "sailor uniform",
      words: ["セーラー", "sailor"],
      color: "#26365e",
    },
    {
      id: "hoodie",
      label: "パーカー",
      tag: "hoodie",
      words: ["パーカー", "hoodie"],
      color: "#9aa3ae",
    },
    {
      id: "dress",
      label: "ワンピース",
      tag: "dress",
      words: ["ワンピース", "ドレス", "dress"],
      color: "#b58cff",
    },
  ],
  face: [
    { id: "smile", label: "笑顔", tag: "smile", words: ["笑顔", "笑って", "smile"] },
    {
      id: "wink",
      label: "ウインク",
      tag: "one eye closed",
      words: ["ウインク", "ウィンク", "wink", "one eye closed"],
    },
    {
      id: "calm",
      label: "無表情",
      tag: "expressionless",
      words: ["無表情", "expressionless", "真顔"],
    },
  ],
  bg: [
    {
      id: "white",
      label: "白背景",
      tag: "white background",
      words: ["白背景", "white background", "simple background"],
    },
    { id: "sky", label: "青空", tag: "blue sky", words: ["青空", "空", "blue sky", "sky"] },
    { id: "room", label: "教室", tag: "classroom", words: ["教室", "classroom"] },
  ],
};

export const ART_KEYS: ArtFeatureKey[] = ["hair", "style", "eyes", "outfit", "face", "bg"];

// お題（かんたん: 白背景・1キャラクター）
export const ART_TOPIC: ArtFeatures = {
  hair: "pink",
  style: "twin",
  eyes: "blue",
  outfit: "sailor",
  face: "smile",
  bg: "white",
};

function artRandom(seed: string) {
  let s = 2166136261;
  for (const char of seed) s = (s * 31 + char.charCodeAt(0)) >>> 0;
  s ||= 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

// プロンプトから特徴を読み取り、書かれていない特徴はランダムに決める
export function artFromPrompt(prompt: string, seed: string) {
  const lower = prompt.toLowerCase();
  const rand = artRandom(seed);
  const features = { ...ART_TOPIC };
  const matched: ArtFeatureKey[] = [];
  for (const key of ART_KEYS) {
    const options = ART_FEATURES[key];
    const hit = options.find((o) => o.words.some((w) => lower.includes(w.toLowerCase())));
    if (hit) matched.push(key);
    const chosen = hit ?? options[Math.floor(rand() * options.length)] ?? options[0];
    if (chosen) features[key] = chosen.id;
  }
  return { features, matched };
}

// お題との一致度から、再現度（仮）を出す
export function artSimilarity(features: ArtFeatures, seed: string) {
  const rand = artRandom(`${seed}-sim`);
  const weights: Record<ArtFeatureKey, number> = {
    hair: 12,
    style: 10,
    eyes: 7,
    outfit: 9,
    face: 6,
    bg: 8,
  };
  let score = 38;
  for (const key of ART_KEYS) if (features[key] === ART_TOPIC[key]) score += weights[key];
  return Math.min(98.9, Math.round((score + rand() * 6) * 10) / 10);
}

function pick(key: ArtFeatureKey, id: string): Option {
  const options = ART_FEATURES[key];
  const found = options.find((o) => o.id === id) ?? options[0];
  if (!found) throw new Error(`特徴がありません: ${key}`);
  return found;
}

// 特徴を短い文字列にして受け渡す（例: pink.twin.blue.sailor.smile.white）
export function encodeArt(features: ArtFeatures) {
  return ART_KEYS.map((k) => features[k]).join(".");
}

export function decodeArt(value: string | null | undefined): ArtFeatures {
  const parts = (value ?? "").split(".");
  const features = { ...ART_TOPIC };
  ART_KEYS.forEach((key, index) => {
    const part = parts[index];
    if (part && ART_FEATURES[key].some((o) => o.id === part)) features[key] = part;
  });
  return features;
}

export type CharacterArtProps = {
  features: ArtFeatures;
  /** 読み上げる説明 */
  label: string;
  /** 縦長の枠に合わせて左右を切り取る */
  cover?: boolean;
};

const SKIN = "#ffe4d4";
const INK = "#2b2f45";

// 特徴をキャラクターのSVGにする（viewBox 200×200）
export function CharacterArt({ features: f, label, cover = false }: CharacterArtProps) {
  const hair = pick("hair", f.hair);
  const hairColor = hair.color ?? "#ff8fc6";
  const hairShade = hair.shade ?? "#ec5fa6";
  const eye = pick("eyes", f.eyes).color ?? "#2f8fe8";
  const outfit = pick("outfit", f.outfit).color ?? "#26365e";
  const uid = `${encodeArt(f)}-${label.length}`;
  return (
    <svg
      className={artImage()}
      viewBox="0 0 200 200"
      preserveAspectRatio={cover ? "xMidYMid slice" : undefined}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      {f.bg === "sky" ? (
        <>
          <defs>
            <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8fd3ff" />
              <stop offset="1" stopColor="#e9f7ff" />
            </linearGradient>
          </defs>
          <rect width="200" height="200" fill={`url(#sky-${uid})`} />
          <ellipse cx="46" cy="52" rx="26" ry="9" fill="#fff" opacity=".9" />
          <ellipse cx="160" cy="36" rx="20" ry="7" fill="#fff" opacity=".85" />
        </>
      ) : f.bg === "room" ? (
        <>
          <rect width="200" height="200" fill="#f6ead3" />
          <rect
            x="118"
            y="18"
            width="64"
            height="70"
            rx="4"
            fill="#cfeaff"
            stroke="#c9a978"
            strokeWidth="5"
          />
          <line x1="150" y1="18" x2="150" y2="88" stroke="#c9a978" strokeWidth="4" />
          <rect x="0" y="150" width="200" height="50" fill="#e3cfa9" />
        </>
      ) : (
        <rect width="200" height="200" fill="#ffffff" />
      )}
      {f.style === "twin" ? (
        <>
          <ellipse
            cx="44"
            cy="120"
            rx="20"
            ry="46"
            fill={hairColor}
            transform="rotate(14 44 120)"
          />
          <ellipse
            cx="156"
            cy="120"
            rx="20"
            ry="46"
            fill={hairColor}
            transform="rotate(-14 156 120)"
          />
          <circle cx="58" cy="70" r="7" fill="#ff5c9b" />
          <circle cx="142" cy="70" r="7" fill="#ff5c9b" />
        </>
      ) : f.style === "bob" ? (
        <path
          d="M52 92 Q52 44 100 44 Q148 44 148 92 L150 132 Q126 140 100 138 Q74 140 50 132 Z"
          fill={hairColor}
        />
      ) : (
        <path d="M50 92 Q50 42 100 42 Q150 42 150 92 L156 190 L44 190 Z" fill={hairColor} />
      )}
      {f.outfit === "sailor" ? (
        <>
          <path d="M44 200 Q48 150 100 146 Q152 150 156 200 Z" fill={outfit} />
          <path d="M70 150 L100 178 L130 150 Q116 146 100 146 Q84 146 70 150 Z" fill="#fff" />
          <path d="M92 170 L100 186 L108 170 L100 164 Z" fill="#e8414f" />
        </>
      ) : f.outfit === "hoodie" ? (
        <>
          <path d="M40 200 Q46 146 100 142 Q154 146 160 200 Z" fill={outfit} />
          <path d="M68 150 Q100 170 132 150" fill="none" stroke="#7f8894" strokeWidth="5" />
          <line x1="92" y1="160" x2="90" y2="186" stroke="#fff" strokeWidth="3" />
          <line x1="108" y1="160" x2="110" y2="186" stroke="#fff" strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M46 200 Q52 150 100 146 Q148 150 154 200 Z" fill={outfit} />
          <path d="M78 150 Q100 166 122 150" fill="none" stroke="#fff" strokeWidth="4" />
        </>
      )}
      <rect x="90" y="128" width="20" height="22" fill={SKIN} />
      <circle cx="100" cy="98" r="40" fill={SKIN} />
      <path
        d="M58 96 Q56 50 100 50 Q144 50 142 96 Q132 76 118 72 Q112 84 96 80 Q88 90 72 86 Q64 92 58 96 Z"
        fill={hairColor}
      />
      <path
        d="M72 58 Q100 46 128 58"
        fill="none"
        stroke={hairShade}
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".6"
      />
      {f.face === "wink" ? (
        <>
          <ellipse cx="82" cy="104" rx="8" ry="11" fill={eye} />
          <circle cx="84" cy="100" r="3" fill="#fff" />
          <path
            d="M110 104 Q118 98 126 104"
            fill="none"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse cx="82" cy="104" rx="8" ry="11" fill={eye} />
          <ellipse cx="118" cy="104" rx="8" ry="11" fill={eye} />
          <circle cx="84" cy="100" r="3" fill="#fff" />
          <circle cx="120" cy="100" r="3" fill="#fff" />
        </>
      )}
      <ellipse cx="72" cy="118" rx="7" ry="4" fill="#ff9fbe" opacity=".7" />
      <ellipse cx="128" cy="118" rx="7" ry="4" fill="#ff9fbe" opacity=".7" />
      {f.face === "calm" ? (
        <line
          x1="94"
          y1="126"
          x2="106"
          y2="126"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M91 122 Q100 132 109 122"
          fill="#ff8a8a"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

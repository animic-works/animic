export const artKeys = ["hair", "style", "eyes", "outfit", "face", "bg"] as const;
export type ArtKey = (typeof artKeys)[number];
export type ArtFeatures = Record<ArtKey, string>;
export interface ArtOption {
  id: string;
  label: string;
  tag: string;
  words: string[];
  color?: string;
  shade?: string;
}
export const artFeatures: Record<ArtKey, ArtOption[]> = {
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
    {
      id: "long",
      label: "ロングヘア",
      tag: "long hair",
      words: ["ロング", "long hair"],
    },
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
    {
      id: "smile",
      label: "笑顔",
      tag: "smile",
      words: ["笑顔", "笑って", "smile"],
    },
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
    {
      id: "sky",
      label: "青空",
      tag: "blue sky",
      words: ["青空", "空", "blue sky", "sky"],
    },
    {
      id: "room",
      label: "教室",
      tag: "classroom",
      words: ["教室", "classroom"],
    },
  ],
};
export const artTopic: ArtFeatures = {
  hair: "pink",
  style: "twin",
  eyes: "blue",
  outfit: "sailor",
  face: "smile",
  bg: "white",
};

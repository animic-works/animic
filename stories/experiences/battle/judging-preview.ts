import { artTags, artRandom } from "../image-generation/art-preview";
import type { RoomRules } from "../room/room-presentation";
import { evaluationModels } from "./evaluation-labels";
import type { rankResults } from "./result-preview";
const topicTags = {
  easy: [
    "1girl",
    "solo",
    "blonde hair",
    "very long hair",
    "low twintails",
    "yellow eyes",
    "beret",
    "pink headwear",
    "hair ribbon",
    "hoodie",
    "blue hoodie",
    "bike shorts",
    "smile",
    "white background",
    "looking at viewer",
  ],
  normal: [
    "1girl",
    "solo",
    "blonde hair",
    "very long hair",
    "glasses",
    "red-framed eyewear",
    "yellow eyes",
    "beret",
    "hoodie",
    "blue hoodie",
    "open mouth",
    "waving",
    "outdoors",
    "tree",
    "looking at viewer",
  ],
  hard: [
    "2girls",
    "blonde hair",
    "white hair",
    "long hair",
    "beret",
    "pink headwear",
    "hoodie",
    "maid headdress",
    "black dress",
    "frills",
    "hug",
    "open mouth",
    "indoors",
    "looking at viewer",
  ],
};
export function modelValue(id: string, value: number) {
  if (id === "wd14" || id === "pixai") return `F1 ${value.toFixed(2)}`;
  if (id === "dreamsim") return `dist ${(1 - value).toFixed(3)}`;
  const prefix =
    id === "ccip" ? "sim" : id === "depth" ? "corr" : id === "openpose" ? "OKS" : "cos";
  return `${prefix} ${value.toFixed(3)}`;
}

export function judgingPreview(
  player: ReturnType<typeof rankResults>[number],
  seed: string,
  level: RoomRules["level"],
) {
  const metrics = player.metrics ?? { char: 0, tag: 0, content: 0, pose: 0 };
  const models = evaluationModels.map((model) => ({
    ...model,
    value: Math.min(
      0.99,
      Math.max(
        0.05,
        metrics[model.category] / 100 + (artRandom(`${seed}-${model.id}`)() - 0.5) * 0.08,
      ),
    ),
  }));
  const mine = player.entry ? artTags(player.entry.image.features) : [];
  const topic = topicTags[level];
  const tags = (values: string[], other: string[]) =>
    values.map((label) => ({
      label,
      value: (0.55 + artRandom(`${seed}-${label}`)() * 0.43).toFixed(2),
      highlighted: other.includes(label),
    }));
  return { metrics, models, mine: tags(mine, topic), topic: tags(topic, mine) };
}

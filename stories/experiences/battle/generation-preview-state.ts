import * as v from "valibot";
import { artFromPrompt, artRandom, artSimilarity } from "../image-generation/art-preview";
import { generatedImageSchema } from "./result-storage";
import type { GeneratedImage, SubmittedImage } from "./battle-presentation";
import { selectionDuration } from "./battle-clock";
export const generationStateSchema = v.object({
  images: v.array(generatedImageSchema),
  selected: v.nullable(v.number()),
  submitted: v.nullable(
    v.object({ image: generatedImageSchema, remaining: v.number(), generations: v.number() }),
  ),
  submittedAt: v.nullable(v.number()),
});
export const emptyGenerations = {
  images: [],
  selected: null,
  submitted: null,
  submittedAt: null,
} satisfies GenerationState;
export function selectionDeadline(state: GenerationState, startedAt: number, duration: number) {
  return (
    Math.max(startedAt + duration, ...state.images.map((image) => image.completesAt)) +
    selectionDuration
  );
}
export interface GenerationState {
  images: GeneratedImage[];
  selected: number | null;
  submitted: SubmittedImage | null;
  submittedAt: number | null;
}
export type GenerationAction =
  | { type: "generate"; prompt: string; code: string; now: number; limit: number }
  | { type: "complete"; id: number; failed: boolean }
  | { type: "select"; id: number }
  | { type: "submit"; id: number; remaining: number; elapsed: number };
export function generationReducer(
  state: GenerationState,
  action: GenerationAction,
): GenerationState {
  if (action.type === "generate") {
    const pending = state.images.filter((image) => image.status === "pending").length;
    const used = state.images.filter((image) => image.status !== "failed").length;
    if (state.submitted || pending >= 3 || (action.limit > 0 && used >= action.limit)) return state;
    const id = state.images.length + 1;
    const features = artFromPrompt(action.prompt, `${action.code}-${id}`);
    return {
      ...state,
      images: [
        ...state.images,
        {
          id,
          features,
          prompt: action.prompt,
          similarity: artSimilarity(features, `${action.code}-${id}`),
          status: "pending",
          createdAt: action.now,
          completesAt: action.now + 1800 + artRandom(`${action.code}-${id}-duration`)() * 1600,
        },
      ],
    };
  }
  if (action.type === "complete") {
    if (!state.images.some((image) => image.id === action.id && image.status === "pending"))
      return state;
    return {
      ...state,
      images: state.images.map((image) =>
        image.id === action.id ? { ...image, status: action.failed ? "failed" : "ready" } : image,
      ),
      selected:
        !state.submitted && !action.failed && state.selected === null ? action.id : state.selected,
    };
  }
  if (action.type === "select")
    return !state.submitted &&
      state.images.some((image) => image.id === action.id && image.status === "ready")
      ? { ...state, selected: action.id }
      : state;
  const image = state.images.find((item) => item.id === action.id && item.status === "ready");
  return image && !state.submitted
    ? {
        ...state,
        submitted: {
          image,
          remaining: Math.max(0, action.remaining),
          generations: state.images.filter((item) => item.status === "ready").length,
        },
        submittedAt: action.elapsed,
      }
    : state;
}

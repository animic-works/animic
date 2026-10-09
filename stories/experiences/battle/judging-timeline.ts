import { evaluationModels } from "./evaluation-labels";

const entryDuration = 1500;
const inferenceDuration = 15000;
const modelsDuration = inferenceDuration * 0.88;
const countDuration = 1400;
const scoreAt = entryDuration + inferenceDuration + 900;

export function judgingDuration(hasEntry: boolean) {
  return hasEntry ? scoreAt + countDuration + 2200 : entryDuration + 1200 + 1800;
}

/** One elapsed time drives the model output, image overlay, score and rank announcement. */
export function judgingMoment(elapsed: number, hasEntry: boolean) {
  const inference = Math.max(0, elapsed - entryDuration);
  const span = modelsDuration / evaluationModels.length;
  const modelIndex = Math.min(evaluationModels.length - 1, Math.floor(inference / span));
  const counting = Math.min(1, Math.max(0, (elapsed - scoreAt) / countDuration));
  return {
    entering: elapsed < entryDuration,
    inference,
    modelIndex,
    modelElapsed: Math.max(0, inference - modelIndex * span),
    modelProgress: Math.min(1, Math.max(0, (inference - modelIndex * span) / span)),
    modelsComplete: inference >= modelsDuration,
    inferenceProgress: Math.min(1, inference / inferenceDuration),
    scoreProgress: 1 - (1 - counting) ** 4,
    scoreVisible: elapsed >= (hasEntry ? scoreAt : entryDuration + 1200),
    rankVisible: elapsed >= (hasEntry ? scoreAt + countDuration : entryDuration + 1200),
    overlay:
      hasEntry && elapsed >= entryDuration && inference < modelsDuration
        ? evaluationModels[modelIndex].id
        : null,
  };
}

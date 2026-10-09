import { readBrowserState, writeBrowserState, useBrowserState } from "../browser-store";
import {
  emptyGenerations,
  generationReducer,
  generationStateSchema,
  selectionDeadline,
  type GenerationAction,
} from "./generation-preview-state";
import { useCallback, useEffect, useRef, useState } from "react";
import { artFromPrompt, artRandom, artSimilarity } from "../image-generation/art-preview";
import type { LobbyModel } from "../room/room-presentation";
import type { BattleModel, BattleResult, GeneratedImage } from "./battle-presentation";
import { battleClock } from "./battle-clock";
export function useBattlePreview(
  room: LobbyModel,
  battle: { id: string; startedAt: number },
  onFinish: (result: BattleResult) => void,
) {
  const me = room.players.find((player) => player.isMe)!;
  const key = `animic-experience-generations:${battle.id}:${me.id}`;
  const state = useBrowserState(key, generationStateSchema) ?? emptyGenerations;
  const dispatch = useCallback(
    (action: GenerationAction) => {
      const previous = readBrowserState(key, generationStateSchema) ?? emptyGenerations;
      const next = generationReducer(previous, action);
      if (next !== previous) writeBrowserState(key, next);
    },
    [key],
  );
  const [elapsed, setElapsed] = useState(() => Math.max(0, Date.now() - battle.startedAt));
  const finished = useRef(false);
  const duration = room.rules.duration * 1000;
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - battle.startedAt), 200);
    return () => clearInterval(timer);
  }, [battle.startedAt]);
  useEffect(() => {
    const timers = state.images
      .filter((image) => image.status === "pending")
      .map((image) =>
        setTimeout(
          () =>
            dispatch({
              type: "complete",
              id: image.id,
              failed: artRandom(`${room.code}-${image.id}-failure`)() < 0.08,
            }),
          Math.max(0, image.completesAt - Date.now()),
        ),
      );
    return () => timers.forEach(clearTimeout);
  }, [state.images, room.code, dispatch]);
  const others = room.players.filter((player) => !player.isMe);
  const selectUntil = selectionDeadline(state, battle.startedAt, duration) - battle.startedAt;
  const judgingAt =
    state.submittedAt !== null
      ? Math.min(selectUntil, state.submittedAt + 2700 + others.length * 1200)
      : selectUntil;
  const phase: BattleModel["phase"] =
    elapsed >= judgingAt
      ? "judging"
      : state.submitted
        ? "submitted"
        : elapsed >= duration
          ? "select"
          : "play";
  useEffect(() => {
    if (elapsed < judgingAt + 1900 || finished.current) return;
    finished.current = true;
    const result: BattleResult = {
      id: battle.id,
      code: room.code,
      rules: room.rules,
      players: room.players.map((player, i) => {
        if (player.isMe) return { ...player, entry: state.submitted };
        const features = artFromPrompt("ピンクの髪、セーラー服", `${room.code}-${player.name}`);
        const image: GeneratedImage = {
          id: 1,
          status: "ready",
          features,
          prompt: "",
          similarity: artSimilarity(features, `${room.code}-${player.name}`),
          createdAt: 0,
          completesAt: 0,
        };
        return {
          ...player,
          entry: {
            image,
            remaining: Math.max(
              0,
              room.rules.duration -
                Math.min(judgingAt / 1000, room.rules.duration * (0.5 + i * 0.08)),
            ),
            generations: Math.max(1, Math.min(room.rules.limit || 5, Math.floor(elapsed / 8000))),
          },
        };
      }),
    };
    onFinish(result);
  }, [
    elapsed,
    judgingAt,
    room.code,
    room.rules,
    room.players,
    state.submitted,
    onFinish,
    battle.id,
  ]);
  const generationCount = state.images.filter((image) => image.status === "ready").length;
  const pendingCount = state.images.filter((image) => image.status === "pending").length;
  const pendingGeneration = state.images.findLast((image) => image.status === "pending");
  const model: BattleModel = {
    id: battle.id,
    participantId: me.id,
    selectionPending: elapsed >= duration && pendingCount > 0,
    code: room.code,
    rules: room.rules,
    clock: battleClock(elapsed, duration, selectUntil),
    phase,
    images: state.images,
    selected: state.images.find((image) => image.id === state.selected) ?? null,
    submitted: state.submitted,
    generationCount,
    pendingCount,
    pendingGeneration: pendingGeneration
      ? {
          id: pendingGeneration.id,
          progress: Math.max(
            0,
            Math.min(
              96,
              ((battle.startedAt + elapsed - pendingGeneration.createdAt) /
                Math.max(1, pendingGeneration.completesAt - pendingGeneration.createdAt)) *
                100,
            ),
          ),
        }
      : null,
    canGenerate:
      phase === "play" &&
      pendingCount < 3 &&
      (!room.rules.limit || generationCount + pendingCount < room.rules.limit),
    players: room.players.map((player, i) => ({
      ...player,
      generations: player.isMe
        ? generationCount
        : Math.max(0, Math.min(room.rules.limit || 5, Math.floor((elapsed - i * 900) / 8000))),
      working: player.isMe ? pendingCount > 0 : elapsed % 8000 < 3000,
      submitted: player.isMe
        ? Boolean(state.submitted)
        : elapsed >=
          Math.min(duration * (0.5 + i * 0.08), (state.submittedAt ?? Infinity) + 1800 + i * 1200),
    })),
  };
  return {
    model,
    actions: {
      generate(prompt: string) {
        if (model.canGenerate && Date.now() < battle.startedAt + duration && prompt.trim())
          dispatch({
            type: "generate",
            prompt,
            code: room.code,
            now: Date.now(),
            limit: room.rules.limit,
          });
      },
      select(id: number) {
        if (phase === "play" || phase === "select") dispatch({ type: "select", id });
      },
      submit(id: number) {
        const current = readBrowserState(key, generationStateSchema) ?? emptyGenerations;
        const now = Date.now();
        if (
          (phase === "play" || phase === "select") &&
          now < selectionDeadline(current, battle.startedAt, duration)
        )
          dispatch({
            type: "submit",
            id,
            remaining: Math.max(0, (battle.startedAt + duration - now) / 1000),
            elapsed: now - battle.startedAt,
          });
      },
    },
  };
}

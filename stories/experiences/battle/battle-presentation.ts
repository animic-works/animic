import type { ArtFeatures } from "../image-generation/art-features";
import type { RoomPlayer, RoomRules } from "../room/room-presentation";
import type { BattleClock } from "./battle-clock";
export interface GeneratedImage {
  id: number;
  status: "pending" | "ready" | "failed";
  features: ArtFeatures;
  prompt: string;
  similarity: number;
  createdAt: number;
  completesAt: number;
}
export interface SubmittedImage {
  image: GeneratedImage;
  remaining: number;
  generations: number;
}
interface BattleParticipant extends RoomPlayer {
  generations: number;
  working: boolean;
  submitted: boolean;
}
export interface BattleResult {
  id: string;
  code: string;
  rules: RoomRules;
  players: { id: string; name: string; isMe: boolean; entry: SubmittedImage | null }[];
}
export interface BattleModel {
  id: string;
  participantId: string;
  selectionPending: boolean;
  code: string;
  rules: RoomRules;
  players: BattleParticipant[];
  clock: BattleClock;
  phase: "play" | "select" | "submitted" | "judging";
  images: GeneratedImage[];
  selected: GeneratedImage | null;
  submitted: SubmittedImage | null;
  canGenerate: boolean;
  generationCount: number;
  pendingCount: number;
  pendingGeneration: { id: number; progress: number } | null;
}
export interface BattleActions {
  generate: (prompt: string) => void;
  select: (id: number) => void;
  submit: (id: number) => void;
}

import { ensureParticipant } from "../../src/lib/auth.client";
import { getCurrentParticipant } from "../../src/lib/auth.functions";
import {
  createRoom,
  getRoomEntry,
  joinRoom,
  leaveRoom,
  setReady,
  setRoomSettings,
} from "../../src/features/room/room.functions";
import { startBattle, submitBattleImage } from "../../src/features/battle/battle.functions";
import { connectRoom } from "../../src/features/room/room-connection";
import {
  getScoringAdminData,
  issueScoringLinkCode,
  revokeScoringWorker,
} from "../../src/features/scoring/scoring-admin.functions";
import { createTopic, listAdminTopics } from "../../src/features/battle/topic-admin.functions";
import {
  getBattleOptions,
  saveBattleOptions,
} from "../../src/features/room/battle-options.functions";
import {
  listPromptGroups,
  savePromptGroup,
  savePromptPhrase,
} from "../../src/features/image-generation/prompt-phrases.functions";
import {
  applyBackupChunk,
  getBackup,
  putBackupImage,
} from "../../src/features/admin/backup.functions";
import type { RoomSnapshot } from "../../src/features/room/room-state";

let disconnect: (() => void) | undefined;
let room: RoomSnapshot | null = null;
let connection = "未接続";

const api = {
  ensureParticipant,
  getCurrentParticipant,
  createRoom,
  getRoomEntry,
  joinRoom,
  leaveRoom,
  setReady,
  setRoomSettings,
  startBattle,
  submitBattleImage,
  issueScoringLinkCode,
  getScoringAdminData,
  revokeScoringWorker,
  createTopic,
  listAdminTopics,
  getBattleOptions,
  saveBattleOptions,
  listPromptGroups,
  savePromptGroup,
  savePromptPhrase,
  getBackup,
  putBackupImage,
  applyBackupChunk,
  async connect(code: string) {
    disconnect?.();
    const entry = await getRoomEntry({ data: { code } });
    if (!entry.room) throw new Error("ルームへの参加が必要です。");
    room = entry.room;
    connection = "接続中…";
    disconnect = connectRoom(
      entry.room,
      (next) => {
        room = next;
      },
      (status) => {
        connection = status;
      },
    );
  },
  snapshot: () => room,
  connection: () => connection,
};

export type TestApi = typeof api;

window.animicTest = api;

import { Avatar } from "@animic/react/avatar";
import { AvatarGroup } from "@animic/react/avatar-group";
import { Badge } from "@animic/react/badge";
import { CodeDisplay } from "@animic/react/code-display";
import { Progress } from "@animic/react/progress";
import { Readout } from "@animic/react/readout";
import { AppBrand } from "../shared/app-brand";
import { accountIconAvatar, type AccountIcon } from "../account/account-icon";
import { levels, playerPalettes } from "../room/room-presentation";
import type { getBattleClock } from "./battle-clock";
import type { BattleSnapshot } from "./battle-state";
import type { BattleStage } from "./battle-screen";

type BattleClock = ReturnType<typeof getBattleClock>;

export function BattleRoomLabel({ code }: { code: string }) {
  return (
    <>
      <AppBrand />
      <Badge>
        ルーム <CodeDisplay value={code} presentation="inline" size="sm" />
      </Badge>
    </>
  );
}

export function BattleRules({ settings }: { settings: BattleSnapshot["settings"] }) {
  return (
    <Badge>
      {levels[settings.difficulty].label}・{settings.durationSeconds}秒
    </Badge>
  );
}

export function BattleTimer({ stage, clock }: { stage: BattleStage; clock: BattleClock }) {
  return (
    <Readout
      role="timer"
      label={stage === "generating" ? "TIME LEFT" : "SELECT"}
      value={clock.label}
      format="clock"
      tone={clock.tone}
      emphasis={clock.urgent ? "urgent" : "normal"}
    />
  );
}

export function BattleProgress({ clock }: { clock: BattleClock }) {
  return (
    <Progress
      label="残り時間"
      value={clock.percent}
      tone={clock.tone === "neutral" ? "gradient" : clock.tone}
      emphasis={clock.urgent ? "urgent" : "normal"}
      striped
      presentation="track"
    />
  );
}

/** 参加者の一覧。本人だけ、提出・生成の状態と生成回数を出す。 */
export function BattlePlayers({
  participantIds,
  participantId,
  names,
  icons,
  submitted,
  generating,
  successCount,
}: {
  participantIds: readonly string[];
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  submitted: boolean;
  generating: boolean;
  successCount: number;
}) {
  const status = submitted ? "complete" : generating ? "busy" : "idle";
  return (
    <AvatarGroup
      label="プレイヤーの様子"
      members={participantIds.map((id, index) => {
        const current = id === participantId;
        const name = names.get(id) ?? (current ? "あなた" : "相手");
        return {
          id,
          name: current ? `${name}（あなた）` : name,
          current,
          detail: current
            ? `${status === "complete" ? "提出済み" : status === "busy" ? "生成中" : "考え中"}・生成 ${successCount}回`
            : "",
          avatar: (
            <Avatar
              size="small"
              name={name}
              fallback={Array.from(name)[0]}
              {...accountIconAvatar(
                icons.get(id) ?? null,
                playerPalettes[index % playerPalettes.length],
              )}
              status={current ? status : undefined}
            />
          ),
        };
      })}
    />
  );
}

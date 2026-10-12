import { ButtonLink } from "@animic/react/link";
import { XLogoIcon } from "../shared/icons";
import { getShareIntentUrl, getShareText } from "./battle-outcome";
import type { BattleSnapshot } from "./battle-state";

/**
 * 結果をXで共有する操作。Xの投稿画面を新しいタブで開く。
 * 載せるのは本人の順位・勝敗と最終スコア、トップページのURLだけ（`getShareText`）。
 */
export function ResultShareLink({
  battle,
  participantId,
}: {
  battle: BattleSnapshot;
  participantId: string;
}) {
  return (
    <ButtonLink
      href={getShareIntentUrl(getShareText(battle, participantId))}
      target="_blank"
      shape="pill"
      size="lg"
      appearance="inverse"
      leadingIcon={<XLogoIcon />}
      // 狭い画面では、3つの操作を並べるためXのアイコンだけにする。
      compactIconOnly
      aria-label="あなたの結果をシェア"
    >
      あなたの結果をシェア
    </ButtonLink>
  );
}

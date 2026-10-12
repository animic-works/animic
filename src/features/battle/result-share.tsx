import { ButtonLink } from "@animic/react/link";
import { useToast } from "@animic/react/toast";
import { activitySdk } from "../../lib/discord-sdk";
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
  const toast = useToast();
  return (
    <ButtonLink
      href={getShareIntentUrl(getShareText(battle, participantId))}
      target="_blank"
      onClick={(event) => {
        const sdk = activitySdk();
        if (!sdk) return;
        event.preventDefault();
        void sdk.commands
          .openExternalLink({ url: getShareIntentUrl(getShareText(battle, participantId)) })
          .catch(() => toast.show({ title: "共有画面を開けませんでした" }));
      }}
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

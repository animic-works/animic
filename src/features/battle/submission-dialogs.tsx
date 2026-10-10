import { ActionGroup } from "@animic/react/action-group";
import { Button } from "@animic/react/button";
import { Dialog } from "@animic/react/dialog";
import { Cluster } from "@animic/react/cluster";
import { Media } from "@animic/react/media";
import { Spinner } from "@animic/react/spinner";
import { Stack } from "@animic/react/stack";
import { Switch } from "@animic/react/switch";
import { Text } from "@animic/react/text";
import type { SucceededGeneration } from "./battle-images";
import type { BattleSnapshot } from "./battle-state";
import {
  SubmissionBackdrop,
  SubmissionContent,
  SubmissionHeading,
  SubmittedArtwork,
} from "./visuals/submission-scene";

export function TopicZoomDialog({
  open,
  onOpenChange,
  imageUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="お題" closeButton={false} size="compact">
      <Stack>
        <Media src={imageUrl} alt="お題のイラスト（全体）" aspect="portrait" fit="contain" />
        <Button appearance="secondary" shape="pill" onClick={() => onOpenChange(false)}>
          閉じる
        </Button>
      </Stack>
    </Dialog>
  );
}

/** 提出前の確認。提出中は閉じさせない。 */
export function SubmitConfirmDialog({
  image,
  open,
  pending,
  error,
  quick,
  onQuickChange,
  onCancel,
  onSubmit,
}: {
  image: SucceededGeneration | undefined;
  open: boolean;
  pending: boolean;
  error: string | undefined;
  quick: boolean;
  onQuickChange: (quick: boolean) => void;
  onCancel: () => void;
  onSubmit: (generationId: string) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !pending && onCancel()}
      title="提出してもよろしいですか？"
      size="compact"
      presentation="centered"
      closeButton={false}
    >
      <Stack>
        {image && (
          <Media src={image.imageUrl} alt="提出する画像" aspect="portrait" size="preview" />
        )}
        <Text variant="body.sm" align="center" tone="supporting">
          提出したあとは変更できません。
        </Text>
        <Switch
          checked={quick}
          onCheckedChange={onQuickChange}
          label="次からは確認せずにすぐ提出する"
        />
        {error && (
          <div role="alert">
            <Text tone="danger">{error}</Text>
          </div>
        )}
        <ActionGroup layout="confirm">
          <Button
            appearance="secondary"
            shape="pill"
            size="lg"
            loading={pending}
            onClick={onCancel}
          >
            選び直す
          </Button>
          <Button
            shape="pill"
            size="lg"
            disabled={!image}
            loading={pending}
            onClick={() => image && onSubmit(image.id)}
          >
            {pending ? "提出しています…" : "提出する"}
          </Button>
        </ActionGroup>
      </Stack>
    </Dialog>
  );
}

/**
 * 提出後・未提出の確定後に、結果が出るまで全面に出す表示。閉じられない。
 * 全員の提出状態が確定して採点中（`scoring`）になったら、採点中であることを示す。
 */
export function SubmissionWaitDialog({
  open,
  battle,
  scoring,
  slow,
  submitted,
  submittedNumber,
  opponentName,
}: {
  open: boolean;
  battle: BattleSnapshot;
  scoring: boolean;
  /** 採点に時間がかかっているか。採点中だけ使う。 */
  slow: boolean;
  submitted: SucceededGeneration | undefined;
  submittedNumber: number;
  /** 2人の対戦の相手の名前。3人以上では使わない。 */
  opponentName: string | null;
}) {
  const notSubmitted = battle.mySubmission?.status === "not-submitted";
  const title = notSubmitted ? "時間内に提出できませんでした" : "提出しました！";
  return (
    <Dialog
      open={open}
      onOpenChange={() => {}}
      title={title}
      titleVisibility="hidden"
      presentation="fullscreen"
      appearance="transparent"
      closeButton={false}
      dismissible={false}
    >
      <SubmissionBackdrop />
      <SubmissionContent>
        <Stack align="center" justify="center" fill>
          {submitted && (
            <>
              <Text variant="eyebrow.strong" tone="inverse">
                SUBMITTED #{submittedNumber}
              </Text>
              <SubmittedArtwork src={submitted.imageUrl} />
            </>
          )}
          <SubmissionHeading>
            <Text variant="display.feedback" tone="inverse" emphasis="accent-shadow">
              {title}
            </Text>
          </SubmissionHeading>
          {scoring ? (
            <Cluster justify="center">
              <Spinner label="採点しています" labelVisibility="hidden" tone="gradient" />
              <Text tone="inverse" aria-hidden="true">
                採点しています
              </Text>
            </Cluster>
          ) : (
            <Text tone="inverse">
              {notSubmitted ? "結果を待っています" : "あとは結果を待つだけ"}
            </Text>
          )}
          {battle.mySubmission?.status === "submitted" && (
            <Text tone="inverse">
              {opponentName === null
                ? battle.submissionsClosed
                  ? "全員の提出がそろいました！"
                  : "ほかの人の提出を待っています"
                : battle.submissionsClosed
                  ? `${opponentName} さんも提出しました！`
                  : `${opponentName} さんの提出を待っています`}
            </Text>
          )}
          {scoring && (
            <div role="status">
              {slow && (
                <Text variant="body.sm" tone="inverse" align="center">
                  採点に時間がかかっています
                  <br />
                  もうしばらくお待ちください
                </Text>
              )}
            </div>
          )}
        </Stack>
      </SubmissionContent>
    </Dialog>
  );
}

import { SubmissionScan } from "./visuals/submission-scan";
import { useEffect, useState } from "react";
import { Dialog } from "@animic/react/dialog";
import { Progress } from "@animic/react/progress";
import { Badge } from "@animic/react/badge";
import { Avatar } from "@animic/react/avatar";
import { Cluster } from "@animic/react/cluster";
import { Container } from "@animic/react/container";
import { ImagePair } from "@animic/react/image-pair";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { artImage } from "../image-generation/visuals/art-image";
import { levels, playerPalettes } from "../../../src/features/room/room-presentation";
import type { BattleModel } from "./battle-presentation";
import {
  SubmissionBackdrop,
  SubmissionContent,
  SubmissionHeading,
  SubmittedArtwork,
} from "../../../src/features/battle/visuals/submission-scene";

export function SubmissionDialog({ model }: { model: BattleModel }) {
  const judging = model.phase === "judging";
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!judging) return undefined;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setProgress(Math.min(100, (now - start) / 18));
      if (now - start < 1800) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [judging]);
  const submitted = model.submitted;
  const others = model.players.filter((player) => !player.isMe);
  const waiting = others.filter((player) => !player.submitted).length;
  return (
    <Dialog
      open={model.phase === "submitted" || judging}
      onOpenChange={() => {}}
      title={judging ? "採点中…" : "提出しました！"}
      titleVisibility="hidden"
      presentation="fullscreen"
      appearance="transparent"
      dismissible={false}
      closeButton={false}
    >
      <SubmissionBackdrop />
      <SubmissionContent>
        <Stack align="center" justify="center" fill>
          {judging ? (
            <Container size="narrow">
              <ImagePair>
                {submitted ? (
                  <Media
                    src={artImage(submitted.image.features)}
                    alt="提出した画像"
                    aspect="portrait"
                    appearance="inverse"
                  />
                ) : (
                  <MediaPlaceholder label="未提出">
                    <Text>未提出</Text>
                  </MediaPlaceholder>
                )}
                <Media
                  src={levels[model.rules.level].image}
                  alt="お題の画像"
                  aspect="portrait"
                  appearance="inverse"
                />
                <SubmissionScan />
              </ImagePair>
            </Container>
          ) : (
            submitted && <SubmittedArtwork src={artImage(submitted.image.features)} />
          )}
          <Text variant="eyebrow.strong" tone="accent-secondary">
            {judging ? "JUDGING" : `SUBMITTED #${submitted?.image.id}`}
          </Text>
          <SubmissionHeading key={model.phase}>
            <Text variant="display.feedback" tone="inverse" emphasis="accent-shadow">
              {judging ? "採点中…" : "提出しました！"}
            </Text>
          </SubmissionHeading>
          <Text variant="label" tone="inverse">
            {judging ? "AIが再現度を評価しています" : "あとは結果を待つだけ"}
          </Text>
          {judging && (
            <Container size="narrow">
              <Progress
                label="採点結果の準備"
                value={progress}
                striped
                tone="gradient"
                presentation="track"
              />
            </Container>
          )}
          {!judging && (
            <Badge appearance="translucent">
              <Cluster space="compact">
                {others.map((player) => (
                  <Avatar
                    key={player.id}
                    size="small"
                    name={player.name}
                    fallback={Array.from(player.name)[0]}
                    palette={playerPalettes[model.players.indexOf(player) % playerPalettes.length]}
                    status={player.submitted ? "complete" : "pending"}
                  />
                ))}
                <Text variant="label.supporting" tone="inverse">
                  {others.length === 1 ? (
                    waiting ? (
                      `${others[0].name} さんの提出を待っています`
                    ) : (
                      `${others[0].name} さんも提出しました！`
                    )
                  ) : waiting ? (
                    <>
                      あと{" "}
                      <Text variant="numeric.supporting" tone="highlight">
                        {waiting}
                      </Text>{" "}
                      人の提出を待っています
                    </>
                  ) : (
                    "全員が提出しました！"
                  )}
                </Text>
              </Cluster>
            </Badge>
          )}
        </Stack>
      </SubmissionContent>
    </Dialog>
  );
}

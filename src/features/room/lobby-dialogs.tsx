import { ActionGroup } from "@animic/react/action-group";
import { Avatar } from "@animic/react/avatar";
import { Button } from "@animic/react/button";
import { Center } from "@animic/react/center";
import { Cluster } from "@animic/react/cluster";
import { CodeDisplay } from "@animic/react/code-display";
import { Dialog } from "@animic/react/dialog";
import { Input } from "@animic/react/input";
import { QrCode } from "@animic/react/qr-code";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import type { LobbyPlayer } from "./lobby-players";

export function InviteDialog({
  open,
  code,
  inviteUrl,
  onClose,
  onCopyUrl,
}: {
  open: boolean;
  code: string;
  inviteUrl: string;
  onClose: () => void;
  onCopyUrl: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="友だちを招待"
      size="compact"
      presentation="centered"
      closeButton={false}
      description="リンクを送るか、コードを伝えるか、QRコードを読み取ってもらおう。"
    >
      <Stack>
        <Cluster layout="nowrap">
          <Input aria-label="ルームURL" value={inviteUrl} readOnly />
          <Button shape="pill" onClick={onCopyUrl}>
            コピー
          </Button>
        </Cluster>
        <Center>
          <CodeDisplay value={code} presentation="cells" />
        </Center>
        <Center>
          <QrCode value={inviteUrl} label="ルームURLのQRコード" />
        </Center>
        <Button appearance="secondary" shape="pill" onClick={onClose}>
          閉じる
        </Button>
      </Stack>
    </Dialog>
  );
}

/** 退出の確認。退出中は閉じさせない。ホストが抜けるときは引き継ぎを伝える。 */
export function LeaveDialog({
  open,
  pending,
  error,
  handsOverHost,
  onClose,
  onLeave,
}: {
  open: boolean;
  pending: boolean;
  error: string | undefined;
  handsOverHost: boolean;
  onClose: () => void;
  onLeave: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !pending && onClose()}
      dismissible={!pending}
      title="ルームを出ますか？"
      closeButton={false}
      description={
        handsOverHost ? "次に参加した人にホストを引き継ぎます。" : "ルームから退出します。"
      }
      presentation="centered"
      size="compact"
    >
      <Stack>
        {error && (
          <div role="alert">
            <Text tone="danger">{error}</Text>
          </div>
        )}
        <ActionGroup layout="confirm">
          <Button appearance="secondary" shape="pill" size="lg" loading={pending} onClick={onClose}>
            やめる
          </Button>
          <Button loading={pending} shape="pill" size="lg" onClick={onLeave}>
            退出する
          </Button>
        </ActionGroup>
      </Stack>
    </Dialog>
  );
}

/** 準備がまだの人がいるときに、そのまま開始するかを確かめる。 */
export function StartAnywayDialog({
  open,
  waiting,
  onClose,
  onStart,
}: {
  open: boolean;
  waiting: readonly LobbyPlayer[];
  onClose: () => void;
  onStart: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="全員の準備がまだです"
      presentation="centered"
      closeButton={false}
      description={`準備中の人が${waiting.length}人います。このまま対戦をはじめますか？`}
      size="compact"
    >
      <Stack>
        {waiting.map((player) => (
          <Cluster key={player.id}>
            <Avatar name={player.name} size="compact" />
            <Text variant="label">{player.name}</Text>
            <Text variant="caption" tone="muted">
              準備中
            </Text>
          </Cluster>
        ))}
        <ActionGroup layout="confirm">
          <Button appearance="secondary" shape="pill" size="lg" onClick={onClose}>
            待つ
          </Button>
          <Button shape="pill" size="lg" onClick={onStart}>
            このままはじめる
          </Button>
        </ActionGroup>
      </Stack>
    </Dialog>
  );
}

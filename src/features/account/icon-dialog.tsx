import { useState } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { Avatar, AvatarButton } from "@animic/react/avatar";
import { Button } from "@animic/react/button";
import { Center } from "@animic/react/center";
import { Cluster } from "@animic/react/cluster";
import { Dialog } from "@animic/react/dialog";
import { Grid } from "@animic/react/grid";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import {
  accountIconAvatar,
  accountIconColors,
  accountIconIllustrations,
  illustrationSrc,
  type AccountIcon,
} from "./account-icon";

/** イラストかカラーからアイコンを選ぶ。保存は呼び出し元が行う。 */
export function IconDialog({
  name,
  icon,
  palette,
  saving,
  onClose,
  onSave,
}: {
  name: string;
  icon: AccountIcon | null;
  /** アイコンを選んでいないときの色。 */
  palette: "pink" | "violet";
  saving: boolean;
  onClose: () => void;
  onSave: (icon: AccountIcon) => void;
}) {
  const [draft, setDraft] = useState<AccountIcon>(icon ?? `color:${palette}`);
  const fallback = Array.from(name)[0];
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="アイコンを変更"
      description="次に作成・参加するルームから、このアイコンで表示されます。"
      size="compact"
      closeButton={false}
    >
      <Stack>
        <Center>
          <Avatar
            size="large"
            name={name}
            fallback={fallback}
            {...accountIconAvatar(draft, palette)}
            ring
          />
        </Center>
        <Text variant="label.supporting">イラスト</Text>
        <Grid columns={4} collapse="none" space="compact">
          {accountIconIllustrations.map((id) => (
            <AvatarButton
              key={id}
              size="fill"
              name={`イラスト ${id}`}
              src={illustrationSrc(id)}
              label={`イラスト ${id}`}
              selected={draft === `illustration:${id}`}
              onClick={() => setDraft(`illustration:${id}`)}
            />
          ))}
        </Grid>
        <Text variant="label.supporting">カラー</Text>
        <Cluster space="compact">
          {accountIconColors.map((color, index) => (
            <AvatarButton
              key={color}
              size="small"
              name={name}
              fallback={fallback}
              palette={color}
              label={`カラー ${index + 1}`}
              selected={draft === `color:${color}`}
              onClick={() => setDraft(`color:${color}`)}
            />
          ))}
        </Cluster>
        <ActionGroup layout="fill">
          <Button appearance="secondary" shape="pill" disabled={saving} onClick={onClose}>
            やめる
          </Button>
          <Button shape="pill" loading={saving} onClick={() => onSave(draft)}>
            保存する
          </Button>
        </ActionGroup>
      </Stack>
    </Dialog>
  );
}

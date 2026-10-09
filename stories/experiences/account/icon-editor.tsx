import { useState } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { Avatar, AvatarButton } from "@animic/react/avatar";
import { Button } from "@animic/react/button";
import { Center } from "@animic/react/center";
import { Cluster } from "@animic/react/cluster";
import { Dialog } from "@animic/react/dialog";
import { FileButton } from "@animic/react/file-button";
import { Grid } from "@animic/react/grid";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { decodeArt } from "../image-generation/art-preview";
import { artImage } from "../image-generation/visuals/art-image";
import { accountColors, accountPalette } from "./account-appearance";
import type { AccountPreview } from "./account-preview";
const illustrations = [
  "pink.twin.blue.sailor.smile.sky",
  "blonde.long.red.hoodie.wink.white",
  "black.bob.green.dress.calm.room",
  "blue.twin.green.sailor.smile.white",
  "silver.long.blue.dress.wink.sky",
  "pink.bob.red.hoodie.calm.room",
  "blonde.twin.blue.dress.smile.sky",
  "black.long.red.sailor.wink.white",
];
export function IconEditor({
  account,
  onClose,
  onSave,
}: {
  account: AccountPreview;
  onClose: () => void;
  onSave: (account: AccountPreview) => void;
}) {
  const [draft, setDraft] = useState(account);
  const [note, setNote] = useState("画像は中央を正方形に切り抜き、丸く表示します。");
  const [loading, setLoading] = useState(false);
  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setNote("画像のファイルを選んでください。");
      return;
    }
    setLoading(true);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const side = Math.min(bitmap.width, bitmap.height);
        const canvas = new OffscreenCanvas(192, 192);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("画像を処理できません");
        context.drawImage(
          bitmap,
          (bitmap.width - side) / 2,
          (bitmap.height - side) / 2,
          side,
          side,
          0,
          0,
          192,
          192,
        );
        const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
        const image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.addEventListener(
            "load",
            () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("画像を処理できません")),
            { once: true },
          );
          reader.addEventListener("error", () => reject(reader.error), { once: true });
          reader.readAsDataURL(blob);
        });
        setDraft((current) => ({ ...current, image, color: undefined }));
        setNote("アップロードした画像を使います。");
      } finally {
        bitmap.close();
      }
    } catch {
      setNote("この画像は読み込めませんでした。別の画像を選んでください。");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="アイコンを変更"
      size="compact"
      closeButton={false}
    >
      <Stack>
        <Center>
          <Avatar
            size="large"
            name={draft.name}
            src={draft.image}
            palette={accountPalette(draft.color)}
            ring
          />
        </Center>
        <Text variant="label.supporting">イラスト</Text>
        <Grid columns={4} collapse="none" space="compact">
          {illustrations.map((code, i) => {
            const src = artImage(decodeArt(code), true);
            return (
              <AvatarButton
                key={code}
                size="fill"
                name={`イラスト ${i + 1}`}
                src={src}
                label={`イラスト ${i + 1}`}
                selected={draft.image === src}
                onClick={() => setDraft({ ...draft, image: src, color: undefined })}
              />
            );
          })}
        </Grid>
        <Text variant="label.supporting">カラー</Text>
        <Cluster space="compact">
          {accountColors.map((color) => (
            <AvatarButton
              key={color.color}
              size="small"
              name={draft.name}
              fallback={Array.from(draft.name)[0]}
              palette={color.palette}
              label={`カラー ${color.color}`}
              selected={!draft.image && (draft.color ?? accountColors[0].color) === color.color}
              onClick={() => setDraft({ ...draft, image: undefined, color: color.color })}
            />
          ))}
        </Cluster>
        <FileButton
          label="画像をアップロード"
          accept="image/*"
          disabled={loading}
          onFile={(file) => void upload(file)}
        />
        <Text variant="caption" tone="muted">
          {note}
        </Text>
        <ActionGroup layout="fill">
          <Button appearance="secondary" shape="pill" onClick={onClose}>
            やめる
          </Button>
          <Button shape="pill" disabled={loading} onClick={() => onSave(draft)}>
            保存する
          </Button>
        </ActionGroup>
      </Stack>
    </Dialog>
  );
}

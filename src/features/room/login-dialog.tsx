import { Dialog } from "../../components/dialog";
import { EntryAlert, EntryLogo, EntryTerms } from "../../components/entry";
import { Stack } from "../../components/layout";
import { LoginButtons, useLogin } from "./login-buttons";

export type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// トップの「スタート」で、ログインしていないときに開くダイアログ。
// ルームを作る画面のログインのカードと同じ並びにし、ログインの後はその画面へ進む
export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      density="compact"
      media={<EntryLogo src="/animic-logo.svg" />}
      title="ログインしてはじめよう"
      description="ルームを作るには、ログインが必要です。"
      closeLabel="閉じる"
    >
      <LoginDialogBody />
    </Dialog>
  );
}

// 閉じると中身ごと外れるため、次に開いたときは接続中や失敗の表示が残らない
function LoginDialogBody() {
  const { connecting, error, login } = useLogin("/start");
  return (
    <Stack gap="4">
      {error ? <EntryAlert>{error}</EntryAlert> : null}
      <LoginButtons connecting={connecting} onLogin={(provider) => void login(provider)} />
      <EntryTerms>
        続行すると、<a href="/terms">利用規約</a>と<a href="/privacy">プライバシーポリシー</a>
        に同意したものとみなします。
      </EntryTerms>
    </Stack>
  );
}

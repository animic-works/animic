import { Dialog } from "@animic/react/dialog";
import { Stack } from "@animic/react/stack";
import { LoginError } from "./login-error";
import { LoginLogo } from "../account/visuals/login-artwork";
import { LoginButtons, useLogin } from "./login-buttons";
import { LoginTerms } from "./login-terms";

export function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      headerMedia={<LoginLogo />}
      title="ログインしてはじめよう"
      description="ルームを作るには、ログインが必要です。"
      size="compact"
      presentation="centered"
      footer={<LoginTerms />}
    >
      <LoginDialogBody />
    </Dialog>
  );
}

function LoginDialogBody() {
  const { connecting, error, login } = useLogin("/start");
  return (
    <Stack>
      {error && <LoginError message={error} />}
      <LoginButtons connecting={connecting} onLogin={(provider) => void login(provider)} />
    </Stack>
  );
}

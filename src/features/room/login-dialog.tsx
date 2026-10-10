import { Dialog } from "@animic/react/dialog";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { LoginError } from "./login-error";
import { LoginLogo } from "../account/visuals/login-artwork";
import { LoginButtons, useLogin } from "./login-buttons";
import { LoginTerms } from "./login-terms";

/** マイページからログインを求めるときに見せる、ログインしてできること（docs/product.md）。 */
const benefits = [
  "ルームを作れる",
  "戦績をあとから見返せる",
  "表示名とアイコンを決められる",
] as const;

/** ログインを求める目的ごとの見出し・説明と、ログインした後に開く画面。 */
const purposes = {
  start: {
    title: "ログインしてはじめよう",
    description: "ルームを作るには、ログインが必要です。",
    returnTo: "/start",
  },
  mypage: {
    title: "ログインしよう",
    description: "戦績を見るにはログインが必要です。",
    returnTo: "/mypage",
  },
} as const;

export function LoginDialog({
  open,
  onOpenChange,
  purpose = "start",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purpose?: keyof typeof purposes;
}) {
  const { title, description, returnTo } = purposes[purpose];
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      headerMedia={<LoginLogo />}
      title={title}
      description={description}
      size="compact"
      presentation="centered"
      footer={<LoginTerms />}
    >
      <LoginDialogBody returnTo={returnTo} showBenefits={purpose === "mypage"} />
    </Dialog>
  );
}

function LoginDialogBody({ returnTo, showBenefits }: { returnTo: string; showBenefits: boolean }) {
  const { connecting, error, login } = useLogin(returnTo);
  return (
    <Stack>
      {showBenefits && (
        <Surface appearance="subtle" padding="sm">
          <Stack space="tight">
            <Text variant="label.supporting">ログインすると</Text>
            {benefits.map((benefit) => (
              <Text key={benefit} as="p" variant="body.sm" tone="supporting">
                <Text tone="accent">✓</Text> {benefit}
              </Text>
            ))}
          </Stack>
        </Surface>
      )}
      {error && <LoginError message={error} />}
      <LoginButtons connecting={connecting} onLogin={(provider) => void login(provider)} />
    </Stack>
  );
}

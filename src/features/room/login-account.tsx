import type { ReactNode } from "react";
import { Cluster } from "@animic/react/cluster";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { ProviderIcon } from "../account/visuals/provider-icon";
import { loginProviderNames, type LoginProvider } from "../../lib/login-providers";

/** ログイン中のアカウント。ログインに使ったサービスの印・名前と、ログアウトなどの操作を並べる。 */
export function LoginAccount({
  provider,
  name,
  action,
}: {
  provider: LoginProvider | null;
  name: string;
  action: ReactNode;
}) {
  return (
    <Surface appearance="subtle" padding="sm">
      <Cluster layout="nowrap" justify="between">
        <Cluster layout="nowrap" space="compact">
          {provider && (
            <ProviderIcon
              provider={provider === "google" ? "Google" : "Discord"}
              inverse={provider === "discord"}
              size={22}
            />
          )}
          <div>
            <Text as="p" variant="label.supporting">
              {provider ? `${loginProviderNames[provider]}でログインしました` : "ログインしました"}
            </Text>
            <Text as="p" variant="caption" tone="supporting">
              {name}
            </Text>
          </div>
        </Cluster>
        {action}
      </Cluster>
    </Surface>
  );
}

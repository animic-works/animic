import { Link } from "@animic/react/link";
import { activitySdk } from "../../lib/discord-sdk";

/** ロゴ。`linked`がfalseなら、押してもトップへ移らない（対戦中など）。 */
export function AppBrand({ linked = true }: { linked?: boolean }) {
  const logo = <img src="/animic-logo.svg" alt="Animic" width="2078" height="607" />;
  return linked && !activitySdk() ? (
    <Link href="/" aria-label="Animic トップ">
      {logo}
    </Link>
  ) : (
    logo
  );
}

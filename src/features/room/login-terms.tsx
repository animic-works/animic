import { Link } from "@animic/react/link";
import { Text } from "@animic/react/text";

export function LoginTerms() {
  return (
    <Text as="p" variant="caption" tone="muted" align="center">
      続行すると、
      <Link appearance="quiet" href="/terms">
        利用規約
      </Link>
      と
      <Link appearance="quiet" href="/privacy">
        プライバシーポリシー
      </Link>
      に同意したものとみなします。
    </Text>
  );
}

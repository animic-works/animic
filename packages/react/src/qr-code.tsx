import { QrCode as ArkQrCode } from "@ark-ui/react/qr-code";
import { qrCode } from "@animic/styled-system/recipes";
export function QrCode({ value, label }: { value: string; label: string }) {
  const c = qrCode();
  return (
    <ArkQrCode.Root value={value} className={c.root}>
      <ArkQrCode.Frame className={c.frame} role="img" aria-label={label}>
        <ArkQrCode.Pattern />
      </ArkQrCode.Frame>
    </ArkQrCode.Root>
  );
}

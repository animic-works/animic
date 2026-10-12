import { QrCode as ArkQrCode } from "@ark-ui/react/qr-code";
import { qrCode } from "@animic/styled-system/recipes";
export function QrCode({
  value,
  label,
  logoSrc,
}: {
  value: string;
  label: string;
  logoSrc?: string;
}) {
  const c = qrCode();
  return (
    <ArkQrCode.Root
      value={value}
      encoding={{ ecc: "H", border: 0 }}
      pixelSize={5}
      className={c.root}
    >
      <div className={c.content}>
        <ArkQrCode.Frame className={c.frame} role="img" aria-label={label}>
          <ArkQrCode.Pattern />
        </ArkQrCode.Frame>
        {logoSrc && <img src={logoSrc} alt="" className={c.logo} />}
      </div>
    </ArkQrCode.Root>
  );
}

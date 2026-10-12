import type { Meta, StoryObj } from "@storybook/react-vite";
import { QrCode } from "@animic/react/qr-code";
import logoSvg from "../public/favicon.svg?raw";

const meta = {
  title: "QR code",
  component: QrCode,
  args: {
    label: "ルームURLのQRコード",
    value: "https://animic.party/rooms/ABCDEFGH",
  },
} satisfies Meta<typeof QrCode>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
export const WithLogo: Story = {
  args: { logoSrc: `data:image/svg+xml,${encodeURIComponent(logoSvg)}` },
};

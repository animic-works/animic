import type { Preview } from "@storybook/react-vite";

import "./preview.css";

const preview: Preview = {
  parameters: {
    // アクセシビリティの違反を一覧で確認できるようにし、違反があればテストでも失敗にする
    a11y: { test: "error" },
    layout: "centered",
  },
};

export default preview;

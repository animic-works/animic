import type { Preview } from "@storybook/react-vite";
import "@animic/styled-system/styles.css";
import "./preview.css";
const preview: Preview = {
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  decorators: [
    (Story) => (
      <main data-animic-root lang="ja">
        <Story />
      </main>
    ),
  ],
};
export default preview;

import { UIProvider } from "@animic/react/ui-provider";
import type { Preview } from "@storybook/react-vite";
import "@animic/styled-system/styles.css";
import "./preview.css";
const preview: Preview = {
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  decorators: [
    (Story, context) => {
      const Root = context.parameters.ownsMain ? "div" : "main";
      return (
        <UIProvider>
          <Root data-animic-root lang="ja">
            <Story />
          </Root>
        </UIProvider>
      );
    },
  ],
};
export default preview;

import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    docs: { toc: true },
    a11y: { test: "todo" },
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      // The calendar fills its container, so every story needs a sized box.
      <div style={{ height: "80vh", minHeight: 420, padding: 12 }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;

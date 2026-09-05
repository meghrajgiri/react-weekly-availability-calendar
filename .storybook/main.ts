import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Served under the docs site, so assets must resolve from that path.
  viteFinal: async (config) => {
    config.base = "/availability-calendar/storybook/";
    return config;
  },
  typescript: {
    // The whole point of Storybook here: the props table is derived from
    // types.ts and its TSDoc, so it can never drift from the source.
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      // Only document our own props, not everything React injects.
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
};

export default config;

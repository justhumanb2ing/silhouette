import { sentryReactRouter } from "@sentry/react-router";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { intlayer, intlayerProxy } from "vite-intlayer";

export default defineConfig((config) => ({
  build: {
    sourcemap: false,
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    intlayer(),
    intlayerProxy(),
    sentryReactRouter(
      {
        org: "hwisik",
        project: "silhouette",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
      config
    ),
  ],
}));

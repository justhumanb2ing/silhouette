import { sentryReactRouter } from "@sentry/react-router";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { intlayer, intlayerProxy } from "vite-intlayer";

const SENTRY_ORG = process.env.SENTRY_ORG ?? "hwisik";
const SENTRY_PROJECT = process.env.SENTRY_PROJECT ?? "silhouette";
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig((configEnv) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    intlayer(),
    intlayerProxy(),
  ];

  const shouldUploadToSentry =
    configEnv.command === "build" && Boolean(SENTRY_AUTH_TOKEN);

  if (shouldUploadToSentry) {
    plugins.push(
      sentryReactRouter(
        {
          org: SENTRY_ORG,
          project: SENTRY_PROJECT,
          authToken: SENTRY_AUTH_TOKEN,
        },
        configEnv
      )
    );
  } else if (configEnv.command === "build") {
    console.warn(
      "Skipping Sentry sourcemap upload because SENTRY_AUTH_TOKEN is missing."
    );
  }

  return {
    build: {
      sourcemap: false,
    },
    plugins,
  };
});

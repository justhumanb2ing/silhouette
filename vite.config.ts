import { sentryReactRouter } from "@sentry/react-router";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { intlayer, intlayerProxy } from "vite-intlayer";

const isProduction = process.env.APP_ENV === "production";

export default defineConfig((config) => {
  const env = loadEnv(config.mode, process.cwd());

  return {
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    build: {
      sourcemap: config.mode === "production",
      rollupOptions: config.isSsrBuild
        ? { input: "./server/app.ts" }
        : undefined,
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
          authToken: env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            assets: "./build/**",
            filesToDeleteAfterUpload: "**/*.map",
          },
        },
        config
      ),
    ],
  };
});

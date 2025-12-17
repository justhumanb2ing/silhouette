import { sentryOnBuildEnd } from "@sentry/react-router";
import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

const shouldFinalizeSentry = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  presets: [vercelPreset()],
  future: {
    v8_middleware: true,
  },

  buildEnd: async ({
    viteConfig: viteConfig,
    reactRouterConfig: reactRouterConfig,
    buildManifest: buildManifest,
  }) => {
    if (!shouldFinalizeSentry) {
      console.warn(
        "Skipping Sentry build finalization because SENTRY_AUTH_TOKEN is missing."
      );
      return;
    }

    await sentryOnBuildEnd({
      viteConfig: viteConfig,
      reactRouterConfig: reactRouterConfig,
      buildManifest: buildManifest,
    });
  },
} satisfies Config;

import { sentryOnBuildEnd } from "@sentry/react-router";
import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,

  presets: [vercelPreset()],

  future: {
    // Keep middleware disabled until the Vercel adapter supplies a RouterContextProvider load context.
    v8_middleware: false,
  },

  buildEnd: async (
    {
      viteConfig: viteConfig,
      reactRouterConfig: reactRouterConfig,
      buildManifest: buildManifest
    }
  ) => {
    await sentryOnBuildEnd({
      viteConfig: viteConfig,
      reactRouterConfig: reactRouterConfig,
      buildManifest: buildManifest
    });
  }
} satisfies Config;
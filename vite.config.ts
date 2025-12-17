import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { intlayer, intlayerProxy } from "vite-intlayer";

export default defineConfig(() => ({
  build: {
    sourcemap: false,
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    intlayer(),
    intlayerProxy(),
  ],
}));

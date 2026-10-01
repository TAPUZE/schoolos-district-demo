import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "schoolos-district-demo";

export default defineConfig({
  base: `/${repository}/`,
  root: "github-pages",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../gh-pages-dist",
    emptyOutDir: true,
  },
});

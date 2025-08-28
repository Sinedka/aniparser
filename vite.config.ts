import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../../dist-react",
        chunkSizeWarningLimit: 1500,
  },
  base: "./",
  root: path.resolve(__dirname, 'src/ui'),
  server: {
    port: 5123,
    strictPort: true,
  },
});

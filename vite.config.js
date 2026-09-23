import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createApiHandler } from "./server/api.js";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const api = () =>
    createApiHandler({
      key: process.env.OPENWEATHER_API_KEY || env.OPENWEATHER_API_KEY,
    });
  return {
    base: process.env.PAGES_BASE_PATH || "/",
    plugins: [
      react(),
      {
        name: "weather-backend",
        configureServer(server) {
          server.middlewares.use(api());
        },
        configurePreviewServer(server) {
          server.middlewares.use(api());
        },
      },
    ],
  };
});

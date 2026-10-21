import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const macChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browserPath =
  process.env.CHROMIUM_PATH ||
  (process.platform === "darwin" && existsSync(macChrome)
    ? macChrome
    : existsSync("/usr/bin/chromium")
      ? "/usr/bin/chromium"
      : undefined);
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3001",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      ...(browserPath ? { executablePath: browserPath } : {}),
      args: [
        "--no-sandbox",
        "--enable-unsafe-swiftshader",
        "--disable-dev-shm-usage",
      ],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [["list"]],
});

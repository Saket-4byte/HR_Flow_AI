import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node index.js",
      url: "http://127.0.0.1:5000/health",
      reuseExistingServer: true,
      timeout: 30000,
      env: {
        PORT: "5000",
        JWT_SECRET: "test-jwt-secret-key-32-chars-long!",
        MONGODB_URI: "mongodb://127.0.0.1:27017/hrflow_test",
      },
    },
    {
      command: "npm run dev --prefix client -- --host 127.0.0.1 --port 5173",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});

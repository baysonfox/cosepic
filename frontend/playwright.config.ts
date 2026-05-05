import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "sh -lc 'cd ../backend && uv run alembic upgrade head && env PYTHONPATH=. DATA_DIR=./playwright_data THUMBNAIL_DIR=./playwright_data/cache/thumbnails uv run python scripts/seed_playwright_data.py && env DATA_DIR=./playwright_data THUMBNAIL_DIR=./playwright_data/cache/thumbnails uv run uvicorn app.main:app --host 127.0.0.1 --port 8000'",
      url: "http://127.0.0.1:8000/api/v1/system/health",
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

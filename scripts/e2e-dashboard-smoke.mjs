import http from "node:http";
import { spawn } from "node:child_process";
import { rm as fsRm } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const productsPayload = {
  success: true,
  data: ["GOM", "CP1"],
};

const instrumentsPayload = {
  success: true,
  data: [
    {
      display_name: "GOMK26 (May)",
      expiry: "2026-04-01",
      market: "Energy",
      product: "GOM",
      symbol: "GOMK26",
    },
    {
      display_name: "GOMM26 (Jun)",
      expiry: "2026-05-04",
      market: "Energy",
      product: "GOM",
      symbol: "GOMM26",
    },
    {
      display_name: "CP1J26 (Apr)",
      expiry: "2026-03-30",
      market: "Environmental",
      product: "CP1",
      symbol: "CP1J26",
    },
  ],
};

const historicalEmptyPayload = {
  success: true,
  data: [],
};

const historicalSnapshotPayload = {
  success: true,
  data: [
    {
      display_name: "GOMK26 (May)",
      expiry: "2026-04-01",
      open_interest: "3",
      product: "GOM",
      settle: "12.50",
      settle_change: "-0.40",
      symbol: "GOMK26",
      total_volume: 636,
      trade_date: "2026-03-12",
    },
    {
      display_name: "CP1J26 (Apr)",
      expiry: "2026-03-30",
      open_interest: "50",
      product: "CP1",
      settle: "14.74",
      settle_change: "0.01",
      symbol: "CP1J26",
      total_volume: 55,
      trade_date: "2026-03-12",
    },
    {
      display_name: "NWEZ26 (Dec)",
      expiry: "2026-11-01",
      open_interest: "0",
      product: "NWE",
      settle: "10.00",
      settle_change: "0.10",
      symbol: "NWEZ26",
      total_volume: 0,
      trade_date: "2026-03-12",
    },
  ],
};

const historicalTimeSeriesPayload = {
  success: true,
  data: [
    {
      display_name: "GOMK26 (May)",
      expiry: "2026-04-01",
      open_interest: "2",
      product: "GOM",
      settle: "11.90",
      settle_change: "0.20",
      symbol: "GOMK26",
      total_volume: 100,
      trade_date: "2026-03-05",
    },
    {
      display_name: "CP1J26 (Apr)",
      expiry: "2026-03-30",
      open_interest: "10",
      product: "CP1",
      settle: "14.70",
      settle_change: "0.10",
      symbol: "CP1J26",
      total_volume: 20,
      trade_date: "2026-03-05",
    },
    {
      display_name: "GOMK26 (May)",
      expiry: "2026-04-01",
      open_interest: "3",
      product: "GOM",
      settle: "12.50",
      settle_change: "-0.40",
      symbol: "GOMK26",
      total_volume: 636,
      trade_date: "2026-03-12",
    },
    {
      display_name: "CP1J26 (Apr)",
      expiry: "2026-03-30",
      open_interest: "50",
      product: "CP1",
      settle: "14.74",
      settle_change: "0.01",
      symbol: "CP1J26",
      total_volume: 55,
      trade_date: "2026-03-12",
    },
    {
      display_name: "NWEZ26 (Dec)",
      expiry: "2026-11-01",
      open_interest: "0",
      product: "NWE",
      settle: "10.00",
      settle_change: "0.10",
      symbol: "NWEZ26",
      total_volume: 0,
      trade_date: "2026-03-12",
    },
  ],
};

const settlementEmptyPayload = {
  success: true,
  data: [],
};

const settlementSnapshotPayload = {
  success: true,
  data: [
    {
      display_name: "GOMK26 (May)",
      expiry: "2026-04-01",
      pre_settle: "12.10",
      product: "GOM",
      settle: "12.50",
      settle_change: "0.40",
      symbol: "GOMK26",
      trade_date: "2026-03-12",
    },
    {
      display_name: "GOMM26 (Jun)",
      expiry: "2026-05-04",
      pre_settle: "12.60",
      product: "GOM",
      settle: "13.20",
      settle_change: "0.60",
      symbol: "GOMM26",
      trade_date: "2026-03-12",
    },
    {
      display_name: "CP1J26 (Apr)",
      expiry: "2026-03-30",
      pre_settle: "14.73",
      product: "CP1",
      settle: "14.74",
      settle_change: "0.01",
      symbol: "CP1J26",
      trade_date: "2026-03-12",
    },
  ],
};

async function main() {
  const fixturePort = await getFreePort();
  const appPort = await getFreePort();
  const fixtureUrl = `http://127.0.0.1:${fixturePort}`;
  const appUrl = `http://127.0.0.1:${appPort}`;
  const distDir = ".next-e2e";

  const fixtureServer = createFixtureServer(fixtureUrl, fixturePort);
  const appServer = startAppServer(appPort, fixtureUrl, distDir);

  try {
    await waitForUrl(`${appUrl}/`);

    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(appUrl, { waitUntil: "domcontentloaded" });

      await page.getByRole("heading", { name: "Weekly volume overlay" }).waitFor();
      await page.getByLabel("As of").waitFor();
      await page.getByLabel("Time window").waitFor();
      await page.getByLabel("Market").waitFor();
      await page.getByLabel("Focus product").waitFor();
      await page.getByLabel("Compare product").waitFor();
      await page.getByRole("button", { name: "Volume" }).waitFor();
      await page.getByText("Activity resolved to Mar 12, 2026").waitFor();
      await page.getByRole("heading", { name: "Settlement change board" }).waitFor();
      await page.getByRole("heading", { name: "Product by tenor visibility" }).waitFor();
      await page.getByRole("heading", { name: "Product activity snapshots" }).waitFor();
      await page.getByRole("heading", { name: "Weekly traded volume" }).waitFor();
      await page.getByRole("heading", { name: "Week-end open interest" }).waitFor();
      await page.getByText("GOMK26").first().waitFor();
      await page.getByText("CP1J26 settle 14.74").waitFor();

      await page.getByRole("tab", { name: /Workflow/i }).click();
      await page.getByRole("heading", { name: "Rank products before you drill into them." }).waitFor();
      await page.getByLabel("Ranking lens").waitFor();
      await page.getByLabel("Market filter").waitFor();
      await page.getByLabel("Pricing coverage").waitFor();
      await page.locator("table.product-ranking-table tbody tr", { hasText: "GOM" }).first().waitFor();
      await page.locator("table.product-ranking-table tbody tr", { hasText: "CP1" }).first().waitFor();
      await page.locator("table.product-ranking-table tbody tr", { hasText: "NWE" }).first().waitFor();
      await page
        .locator("table.product-ranking-table tbody tr", { hasText: "CP1" })
        .getByRole("button", { name: "Set left" })
        .click();
      await page.locator(".comparison-hero-left", { hasText: "CP1" }).waitFor();
      await page
        .locator("table.product-ranking-table tbody tr", { hasText: "NWE" })
        .getByRole("button", { name: "Set right" })
        .click();
      await page.locator(".comparison-hero-right", { hasText: "NWE" }).waitFor();
      await page
        .locator("table.product-ranking-table tbody tr", { hasText: "CP1" })
        .getByRole("button", { name: /Inspect/ })
        .click();
      await page.getByRole("heading", { name: "CP1 weekly activity" }).waitFor();

      await page.getByRole("tab", { name: /Revenue/i }).click();
      await page.getByRole("heading", {
        name: "Stress the fee model without contaminating observed market data.",
      }).waitFor();
      await page.getByRole("heading", { name: "Weekly modeled fee revenue" }).waitFor();
      await page.getByText("Observed input").waitFor();
      await page.getByText("Modeled layer").waitFor();
      await page.getByText("691 latest lots").waitFor();
    } finally {
      await browser.close();
    }
  } finally {
    await stopChild(appServer);
    await new Promise((resolve, reject) => {
      fixtureServer.close((error) => (error ? reject(error) : resolve()));
    });
    await fsRm(distDir, { force: true, recursive: true });
  }
}

function createFixtureServer(fixtureUrl, fixturePort) {
  return http
    .createServer((request, response) => {
      const url = new URL(request.url ?? "/", fixtureUrl);

      if (url.pathname === "/products") {
        return json(response, productsPayload);
      }

      if (url.pathname === "/instruments") {
        return json(response, instrumentsPayload);
      }

      if (url.pathname === "/historical-data") {
        const asOf = url.searchParams.get("asof");
        if (asOf === "2026-03-13") {
          return json(response, historicalEmptyPayload);
        }

        if (asOf === "2026-03-12") {
          return json(response, historicalSnapshotPayload);
        }

        return json(response, { success: true, data: [] });
      }

      if (url.pathname === "/historical-data/time-series") {
        return json(response, historicalTimeSeriesPayload);
      }

      if (url.pathname === "/settlement-data") {
        const asOf = url.searchParams.get("asof");
        if (asOf === "2026-03-13") {
          return json(response, settlementEmptyPayload);
        }

        if (asOf === "2026-03-12") {
          return json(response, settlementSnapshotPayload);
        }

        return json(response, { success: true, data: [] });
      }

      response.statusCode = 404;
      response.end("Not found");
      return undefined;
    })
    .listen(fixturePort, "127.0.0.1");
}

function startAppServer(appPort, fixtureUrl, distDir) {
  return spawn(
    process.execPath,
    [
      "./node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(appPort),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ABAXX_MARKET_DATA_BASE_URL: fixtureUrl,
        ABAXX_SNAPSHOT_NOW: "2026-03-13T12:00:00Z",
        NEXT_DIST_DIR: distDir,
      },
      stdio: "inherit",
    },
  );
}

async function waitForUrl(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Ignore connection errors until the server is ready.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function json(response, payload) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(payload));
}

async function stopChild(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5000).then(() => {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    }),
  ]);
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not determine a free local port"));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
    server.on("error", reject);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

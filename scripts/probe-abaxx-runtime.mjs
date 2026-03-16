import { chromium } from "playwright";

const events = [];
const seen = new Set();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("response", (response) => {
  const url = response.url();
  if (!/abaxx|xabx|directus|socket/i.test(url)) {
    return;
  }

  const key = `${response.status()} ${url}`;
  if (!seen.has(key)) {
    seen.add(key);
    events.push(key);
  }
});

page.on("requestfailed", (request) => {
  const url = request.url();
  if (!/abaxx|xabx|directus|socket/i.test(url)) {
    return;
  }

  const failure = request.failure();
  const key = `FAILED ${failure ? failure.errorText : "unknown"} ${url}`;
  if (!seen.has(key)) {
    seen.add(key);
    events.push(key);
  }
});

await page.goto("https://abaxx.exchange/market-data", {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await page.waitForTimeout(15000);

console.log(`TITLE=${await page.title()}`);
console.log(`URL=${page.url()}`);
console.log("EVENTS_START");
for (const event of events) {
  console.log(event);
}
console.log("EVENTS_END");

await browser.close();

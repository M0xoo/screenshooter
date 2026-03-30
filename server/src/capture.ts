import { chromium, type Browser } from "playwright";
import type { CaptureRequest } from "@screenshoter/shared";

const MAX_FULL_PAGE_HEIGHT = 16_384;

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

export async function captureScreenshot(req: CaptureRequest): Promise<Buffer> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: req.viewport,
    deviceScaleFactor: req.deviceScaleFactor,
  });
  const page = await context.newPage();

  try {
    await page.goto(req.url, {
      waitUntil: req.waitUntil,
      timeout: req.timeoutMs,
    });

    if (req.fullPage) {
      const scrollHeight = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      if (scrollHeight > MAX_FULL_PAGE_HEIGHT) {
        return await page.screenshot({
          type: "png",
          clip: {
            x: 0,
            y: 0,
            width: req.viewport.width,
            height: MAX_FULL_PAGE_HEIGHT,
          },
        });
      }
      return await page.screenshot({ type: "png", fullPage: true });
    }

    return await page.screenshot({ type: "png" });
  } finally {
    await context.close();
  }
}

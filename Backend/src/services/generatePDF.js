import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const isProduction = process.env.NODE_ENV === "production";

let browserInstance = null;
let pdfsGeneratedSinceRestart = 0;
const MAX_PDFS_BEFORE_RESTART = 300;

const getBrowser = async () => {
  const canReuse =
    browserInstance &&
    browserInstance &&
    pdfsGeneratedSinceRestart < MAX_PDFS_BEFORE_RESTART;

  if (canReuse) return browserInstance;

  // Close old browser cleanly if it exists (e.g. restart threshold hit)
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (err) {
      console.warn("Old browser failed to close cleanly:", err.message);
    }
  }

  browserInstance = await puppeteer.launch(
    isProduction
      ? {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
      : {
          executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          headless: true,
          args: ["--no-sandbox"],
        },
  );

  pdfsGeneratedSinceRestart = 0;

  browserInstance.on("disconnected", () => {
    console.warn("Browser disconnected — will relaunch on next request.");
    browserInstance = null;
  });

  return browserInstance;
};

export const warmUpPage = async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  // Set viewport early — one less thing to do later
  await page.setViewport({ width: 794, height: 1123 });
  // Safety net: the resume is plain HTML/CSS, so scripts never need to run
  // and the page never needs to load anything from the internet.
  await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on("request", (request) => request.abort());
  return page; // caller is responsible for closing this page
};

export const generatePDFFromPage = async (page, html) => {
  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const [pdfBuffer, thumbnailBuffer] = await Promise.all([
      page.pdf({
        format: "A4",
        printBackground: true,
      }),
      page.screenshot({
        type: "jpeg",
        quality: 80,
        clip: { x: 0, y: 0, width: 794, height: 1123 }, // crop to exactly one A4 page
      }),
    ]);

    pdfsGeneratedSinceRestart += 1;
    return { pdfBuffer, thumbnailBuffer };
  } finally {
    // Always close the page (tab) — never the browser itself
    await page.close();
  }
};

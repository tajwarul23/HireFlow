import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const isProduction = process.env.NODE_ENV === "production";

let browserInstance = null;
let launchPromise = null; // shared by concurrent callers so Chrome is only launched once
let executablePathPromise = null; // the Chromium binary is unpacked to /tmp only once
let pdfsGeneratedSinceRestart = 0;
const MAX_PDFS_BEFORE_RESTART = 300;

const launchBrowser = async () => {
  if (!isProduction) {
    return puppeteer.launch({
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: true,
      args: ["--no-sandbox"],
    });
  }

  executablePathPromise ??= chromium.executablePath().catch((err) => {
    executablePathPromise = null;
    throw err;
  });
  const options = {
    args: [...chromium.args, "--disable-dev-shm-usage"],
    defaultViewport: chromium.defaultViewport,
    executablePath: await executablePathPromise,
    headless: chromium.headless,
  };

  try {
    return await puppeteer.launch(options);
  } catch (err) {
    // ETXTBSY = the freshly unpacked binary is still held open for writing; retry once
    if (err.code !== "ETXTBSY") throw err;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return puppeteer.launch(options);
  }
};

const getBrowser = async () => {
  const canReuse =
    browserInstance &&
    browserInstance.connected &&
    pdfsGeneratedSinceRestart < MAX_PDFS_BEFORE_RESTART;

  if (canReuse) return browserInstance;

  // Another request is already launching Chrome — wait for that one
  if (launchPromise) return launchPromise;

  launchPromise = (async () => {
    // Close old browser cleanly if it exists (e.g. restart threshold hit)
    if (browserInstance) {
      try {
        await browserInstance.close();
      } catch (err) {
        console.warn("Old browser failed to close cleanly:", err.message);
      }
    }

    const browser = await launchBrowser();
    pdfsGeneratedSinceRestart = 0;

    browser.on("disconnected", () => {
      console.warn("Browser disconnected — will relaunch on next request.");
      if (browserInstance === browser) browserInstance = null;
    });

    browserInstance = browser;
    return browser;
  })();

  try {
    return await launchPromise;
  } finally {
    launchPromise = null;
  }
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

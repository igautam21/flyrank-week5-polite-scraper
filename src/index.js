
const fs = require("fs/promises");
const path = require("path");

const PAGE_URL = "https://books.toscrape.com/";
const CACHE_DIR = path.join(__dirname, "..", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "catalogue-page-1.html");

const USER_AGENT =
    "FlyRankInternship-Gautam/1.0 (+https://github.com/igautam21)";

async function fetchCataloguePage() {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // If the HTML is already cached, use the local copy.
    try {
        const cachedHTML = await fs.readFile(CACHE_FILE, "utf8");

        console.log("CACHE HIT");
        console.log(`Response size: ${Buffer.byteLength(cachedHTML)} bytes`);
        return cachedHTML;
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }

    console.log("FETCH");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(PAGE_URL, {
            method: "GET",
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "text/html"
            },
            signal: controller.signal
        });

        if (response.status !== 200) {
            throw new Error(`Fetch failed with HTTP ${response.status}`);
        }

        const html = await response.text();

        await fs.writeFile(CACHE_FILE, html, "utf8");

        console.log(`Response size: ${Buffer.byteLength(html)} bytes`);
        console.log(`Cached at: ${CACHE_FILE}`);

        return html;
    } finally {
        clearTimeout(timeout);
    }
}

fetchCataloguePage().catch((error) => {
    console.error("Scraper failed:", error.message);
    process.exitCode = 1;
});

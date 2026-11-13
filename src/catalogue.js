const fs = require("fs/promises");
const path = require("path");
const cheerio = require("cheerio");

const BASE_URL = "https://books.toscrape.com/";
const CACHE_DIR = path.join(__dirname, "..", "cache");

const USER_AGENT =
    "FlyRankInternship-Gautam/1.0 (+https://github.com/igautam21)";

const REQUEST_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 10000;

// Tracks when the previous real network request started.
let lastNetworkRequestAt = null;

function getCacheFile(pageNumber) {
    return path.join(
        CACHE_DIR,
        `catalogue-page-${pageNumber}.html`
    );
}

// Wait at least 500 ms between real network requests.
async function waitForPoliteInterval() {
    if (lastNetworkRequestAt !== null) {
        const elapsed = Date.now() - lastNetworkRequestAt;
        const remaining = REQUEST_DELAY_MS - elapsed;

        if (remaining > 0) {
            await new Promise((resolve) =>
                setTimeout(resolve, remaining)
            );
        }
    }

    lastNetworkRequestAt = Date.now();
}

async function loadCataloguePage(pageNumber, pageUrl) {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    const cacheFile = getCacheFile(pageNumber);

    // Use cached HTML whenever it is available.
    try {
        const html = await fs.readFile(cacheFile, "utf8");

        console.log(`CACHE HIT: page ${pageNumber}`);
        console.log(
            `Response size: ${Buffer.byteLength(html)} bytes`
        );

        return html;
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }

    // Only real network requests need the polite delay.
    await waitForPoliteInterval();

    console.log(`FETCH: page ${pageNumber}`);

    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
    );

    try {
        const response = await fetch(pageUrl, {
            method: "GET",
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "text/html"
            },
            signal: controller.signal
        });

        if (response.status !== 200) {
            throw new Error(
                `HTTP ${response.status} while fetching ${pageUrl}`
            );
        }

        const html = await response.text();

        await fs.writeFile(cacheFile, html, "utf8");

        console.log(
            `Response size: ${Buffer.byteLength(html)} bytes`
        );
        console.log(`Cached at: ${cacheFile}`);

        return html;
    } finally {
        clearTimeout(timeout);
    }
}

async function discoverBooks() {
    let currentUrl = BASE_URL;

    const allBookUrls = new Set();

    let cataloguePages = 0;
    let discoveredCount = 0;

    while (currentUrl && cataloguePages < 3) {
        cataloguePages++;

        const html = await loadCataloguePage(
            cataloguePages,
            currentUrl
        );

        const $ = cheerio.load(html);

        // Count every book link and store its absolute URL.
        $("article.product_pod h3 a").each((_, element) => {
            const href = $(element).attr("href");

            if (href) {
                discoveredCount++;

                const absoluteUrl = new URL(
                    href,
                    currentUrl
                ).href;

                allBookUrls.add(absoluteUrl);
            }
        });

        // Follow the catalogue's own Next link.
        const nextHref = $("li.next a").attr("href");

        currentUrl = nextHref
            ? new URL(nextHref, currentUrl).href
            : null;
    }

    const uniqueUrls = [...allBookUrls];

    console.log("\nDiscovery Summary");
    console.log("-----------------");
    console.log(`catalogue_pages=${cataloguePages}`);
    console.log(`discovered=${discoveredCount}`);
    console.log(`unique_urls=${uniqueUrls.length}`);

    return uniqueUrls;
}

module.exports = { discoverBooks };
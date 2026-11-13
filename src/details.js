
const fs = require("fs/promises");
const path = require("path");
const cheerio = require("cheerio");

const CACHE_DIR = path.join(__dirname, "..", "cache", "details");

const USER_AGENT =
    "FlyRankInternship-Gautam/1.0 (+https://github.com/igautam21)";

const REQUEST_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 1;

let lastNetworkRequestAt = null;

// Custom error containing the failed URL and HTTP status.
class PageFetchError extends Error {
    constructor(message, productUrl, status = null, retryable = false) {
        super(message);
        this.name = "PageFetchError";
        this.productUrl = productUrl;
        this.status = status;
        this.retryable = retryable;
    }
}

function getCacheFile(productUrl) {
    const pathname = new URL(productUrl).pathname;
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 2];

    if (!slug) {
        throw new Error(`Cannot determine book cache filename: ${productUrl}`);
    }

    return path.join(CACHE_DIR, `${slug}.html`);
}

async function waitForPoliteInterval() {
    if (lastNetworkRequestAt !== null) {
        const elapsed = Date.now() - lastNetworkRequestAt;
        const remaining = REQUEST_DELAY_MS - elapsed;

        if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining));
        }
    }

    lastNetworkRequestAt = Date.now();
}

async function fetchBookPage(productUrl) {
    await waitForPoliteInterval();

    console.log(`FETCH: ${productUrl}`);

    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
    );

    try {
        const response = await fetch(productUrl, {
            method: "GET",
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "text/html"
            },
            signal: controller.signal
        });

        if (response.status !== 200) {
            const retryable = response.status >= 500 && response.status <= 599;

            throw new PageFetchError(
                `HTTP ${response.status} while fetching ${productUrl}`,
                productUrl,
                response.status,
                retryable
            );
        }

        return await response.text();

    } catch (error) {
        if (error instanceof PageFetchError) {
            throw error;
        }

        const timedOut = error.name === "AbortError";

        throw new PageFetchError(
            timedOut
                ? `Request timed out: ${productUrl}`
                : `Network error: ${error.message}`,
            productUrl,
            null,
            true
        );

    } finally {
        clearTimeout(timeout);
    }
}

async function loadBookPage(productUrl) {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    const cacheFile = getCacheFile(productUrl);

    // Use cached HTML when available.
    try {
        const html = await fs.readFile(cacheFile, "utf8");

        console.log(`CACHE HIT: ${path.basename(cacheFile)}`);

        return {
            html,
            cacheHit: true
        };

    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }

    // Attempt the request, with one retry for eligible failures.
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const html = await fetchBookPage(productUrl);

            await fs.writeFile(cacheFile, html, "utf8");

            console.log(`Cached at: ${cacheFile}`);

            return {
                html,
                cacheHit: false
            };

        } catch (error) {
            if (!(error instanceof PageFetchError)) {
                throw error;
            }

            const canRetry = error.retryable && attempt < MAX_RETRIES;

            if (!canRetry) {
                throw error;
            }

            console.log(
                `RETRY: Attempt ${attempt + 2} for ${productUrl}`
            );
        }
    }
}

function extractBookDetails(html, productUrl, sourcePage) {
    const $ = cheerio.load(html);

    const title = $(".product_main h1").text().trim();

    const priceText = $(".price_color").first().text().trim();

    const availabilityText = $(".availability")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

    const ratingClass = $(".star-rating").attr("class") || "";

    const ratingText = ratingClass
        .split(/\s+/)
        .find(className => className !== "star-rating") || null;

    const descriptionElement = $("#product_description").next("p");

    const description = descriptionElement.length
        ? descriptionElement.text().trim()
        : null;

    return {
        title,
        product_url: productUrl,
        price_text: priceText,
        availability_text: availabilityText,
        rating_text: ratingText,
        description,
        source_page: sourcePage,
        fetched_at: new Date().toISOString()
    };
}

async function scrapeBook(book) {
    const result = await loadBookPage(book.url);

    const record = extractBookDetails(
        result.html,
        book.url,
        book.source_page
    );

    return {
        record,
        cacheHit: result.cacheHit
    };
}

module.exports = {
    scrapeBook,
    PageFetchError
};


const fs = require("fs/promises");
const path = require("path");

const { discoverBooks } = require("./catalogue");
const { scrapeBook, PageFetchError } = require("./details");
const { normalizePrice } = require("./normalize");
const { BookSchema } = require("./schema");

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function saveJson(filename, data) {
    const filePath = path.join(OUTPUT_DIR, filename);

    await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8"
    );
}

async function main() {
    const runStartedAt = new Date();
    const startTime = Date.now();

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const books = await discoverBooks();

    const validRecords = [];
    const invalidRecords = [];
    const failedPages = [];

    let cacheHits = 0;
    let pagesFetched = 0;

    console.log("\nStarting detail-page scraping...");
    console.log(`Books to process: ${books.length}`);

    for (let i = 0; i < books.length; i++) {
        const book = books[i];

        console.log(`\nProcessing book ${i + 1}/${books.length}`);

        try {
            const result = await scrapeBook(book);

            if (result.cacheHit) {
                cacheHits++;
            } else {
                pagesFetched++;
            }

            const rawRecord = result.record;

            const normalizedRecord = {
                ...rawRecord,
                price_gbp: normalizePrice(rawRecord.price_text)
            };

            const validation = BookSchema.safeParse(normalizedRecord);

            if (!validation.success) {
                invalidRecords.push({
                    product_url: rawRecord.product_url,
                    title: rawRecord.title,
                    reason: validation.error.issues.map(issue => ({
                        field: issue.path.join("."),
                        message: issue.message
                    }))
                });

                console.log("INVALID:", rawRecord.title);
                continue;
            }

            validRecords.push(validation.data);
            console.log("VALID:", rawRecord.title);

        } catch (error) {
            const failure = {
                product_url: book.url,
                title: book.title || null,
                reason: error.message
            };

            invalidRecords.push(failure);

            if (error instanceof PageFetchError) {
                failedPages.push({
                    url: error.productUrl,
                    status: error.status,
                    reason: error.message
                });
            }

            console.log("FAILED:", error.message);
        }
    }

    await saveJson("books.json", validRecords);
    await saveJson("errors.json", invalidRecords);

    const durationMs = Date.now() - startTime;

    const runReport = {
        started_at: runStartedAt.toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        catalogue_pages: 3,
        discovered_books: books.length,
        pages_fetched: pagesFetched,
        cache_hits: cacheHits,
        valid_records: validRecords.length,
        invalid_records: invalidRecords.length,
        failed_pages: failedPages
    };

    await saveJson("run-report.json", runReport);

    console.log("\nStage 5 Run Summary");
    console.log("-----------------------");
    console.log(`Discovered books: ${books.length}`);
    console.log(`Pages fetched: ${pagesFetched}`);
    console.log(`Cache hits: ${cacheHits}`);
    console.log(`Valid records: ${validRecords.length}`);
    console.log(`Invalid records: ${invalidRecords.length}`);
    console.log(`Failed pages: ${failedPages.length}`);
    console.log(`Duration: ${durationMs} ms`);

    console.log("\nOutput files:");
    console.log("output/books.json");
    console.log("output/errors.json");
    console.log("output/run-report.json");
}

main().catch(error => {
    console.error("\nScraper failed:", error.message);
    process.exitCode = 1;
});

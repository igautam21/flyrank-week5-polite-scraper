const fs = require("fs/promises");
const path = require("path");

const { discoverBooks } = require("./catalogue");
const { scrapeBook } = require("./details");
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
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const books = await discoverBooks();

    console.log("\nStarting detail-page scraping...");
    console.log(`Books to process: ${books.length}`);

    const validRecords = [];
    const invalidRecords = [];

    for (let i = 0; i < books.length; i++) {
        const book = books[i];

        console.log(`\nProcessing book ${i + 1}/${books.length}`);

        try {
            // Step 1: Scrape the raw book details.
            const rawRecord = await scrapeBook(book);

            // Step 2: Convert the price text into a number.
            const priceGbp = normalizePrice(rawRecord.price_text);

            // Step 3: Add the normalized price to the raw record.
            const normalizedRecord = {
                ...rawRecord,
                price_gbp: priceGbp
            };

            // Step 4: Validate the complete record using Zod.
            const result = BookSchema.safeParse(normalizedRecord);

            if (result.success) {
                validRecords.push(result.data);
                console.log("VALID:", normalizedRecord.title);
            } else {
                invalidRecords.push({
                    product_url: rawRecord.product_url,
                    title: rawRecord.title,
                    reason: result.error.issues.map(issue => ({
                        field: issue.path.join("."),
                        message: issue.message
                    }))
                });

                console.log("INVALID:", rawRecord.title);
            }
        } catch (error) {
            invalidRecords.push({
                product_url: book.url,
                reason: error.message
            });

            console.log("ERROR:", error.message);
        }
    }

    // Save valid and invalid records separately.
    await saveJson("books.json", validRecords);
    await saveJson("errors.json", invalidRecords);

    console.log("\nStage 4 Summary");
    console.log("-----------------------");
    console.log(`Discovered books: ${books.length}`);
    console.log(`Valid records: ${validRecords.length}`);
    console.log(`Invalid records: ${invalidRecords.length}`);

    console.log("\nOutput files:");
    console.log("output/books.json");
    console.log("output/errors.json");

    if (validRecords.length > 0) {
        console.log("\nFirst Valid Book Record:");
        console.log(JSON.stringify(validRecords[0], null, 2));
    }
}

main().catch((error) => {
    console.error("\nScraper failed:", error.message);
    process.exitCode = 1;
});
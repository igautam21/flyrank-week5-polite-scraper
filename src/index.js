
const { discoverBooks } = require("./catalogue");
const { scrapeBook } = require("./details");

async function main() {
    // Stage 2: Discover books from the first three catalogue pages.
    const books = await discoverBooks();

    console.log("\nStarting detail-page scraping...");
    console.log(`Books to process: ${books.length}`);

    const records = [];

    // Stage 3: Visit each detail page sequentially.
    for (let i = 0; i < books.length; i++) {
        const book = books[i];

        console.log(
            `\nProcessing book ${i + 1}/${books.length}`
        );

        const record = await scrapeBook(book);

        records.push(record);
    }

    console.log("\nDetail Scraping Summary");
    console.log("-----------------------");
    console.log(`detail_pages=${records.length}`);

    console.log("\nFirst Raw Book Record:");
    console.log(JSON.stringify(records[0], null, 2));
}

main().catch((error) => {
    console.error("\nScraper failed:", error.message);
    process.exitCode = 1;
});

const { discoverBooks } = require("./catalogue");

discoverBooks()
    .then((urls) => {
        console.log("\nFirst 3 book URLs:");
        console.log(urls.slice(0, 3));
    })
    .catch((error) => {
        console.error("Scraper failed:", error.message);
        process.exitCode = 1;
    });
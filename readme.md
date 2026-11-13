# FlyRank Week 5 – The Polite Scraper

A polite web scraper built with Node.js for the FlyRank Backend AI Engineering Internship.

This project collects book information from the first three catalogue pages of [Books to Scrape](https://books.toscrape.com/), visits the corresponding 60 detail pages, extracts and normalizes information, validates records using Zod, and exports structured JSON files.

The scraper uses caching, request delays, timeouts, retry handling, and failure reporting to avoid unnecessary requests and handle individual page failures gracefully.

## 1. Target Classification

**Target website:** https://books.toscrape.com/

**Website type:** Educational web scraping practice sandbox.

**Purpose:** Books to Scrape is a fictional bookstore designed for practicing web scraping. It provides publicly accessible book information.

**Scraping scope:**
- First three catalogue pages only.
- 20 books per catalogue page.
- Corresponding 60 book detail pages.
- No additional catalogue pages are scraped.

**Data collected:**
- Book title
- Product URL
- Original price text
- Normalized price in GBP
- Availability
- Star rating
- Description, if available
- Source catalogue page
- Fetch timestamp

**Robots.txt check:** The scraper's initial request to `https://books.toscrape.com/robots.txt` returned HTTP 404 Not Found. No robots.txt file was found. A missing robots.txt file is not treated as permission to scrape other websites.

**Why this target is appropriate:** Books to Scrape is an educational scraping sandbox intended for practice. The project is limited to this target and uses conservative request behaviour.

**Commitment:** I will not reuse this code on another site without checking its rules and terms first.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| Node.js 20+ | JavaScript runtime |
| JavaScript | Application logic |
| Built-in Fetch API | HTTP requests |
| Cheerio | HTML parsing |
| Zod | Data schema validation |
| JSON | Structured data storage |

## 3. Project Structure

```text
scraper/
├── src/
│   ├── catalogue.js       # Catalogue discovery and HTML caching
│   ├── details.js         # Detail-page fetching and extraction
│   ├── normalize.js       # Price normalization
│   ├── schema.js          # Zod validation schema
│   └── index.js           # Main scraper and run reporting
│
├── output/
│   ├── books.json         # Validated book records
│   ├── errors.json        # Invalid records and errors
│   └── run-report.json    # Execution summary
│
├── cache/                 # Cached HTML (not committed)
├── node_modules/          # Dependencies (not committed)
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## 4. Installation and Execution

### Requirements

- Node.js 20 or later
- npm
- Internet connection for the initial scrape

### Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd scraper
```

### Install dependencies

```bash
npm install
```

### Run the scraper

```bash
npm start
```

The scraper processes the first three catalogue pages and generates three files inside the `output/` directory.

Previously downloaded HTML is reused from the cache, avoiding unnecessary network requests.

## 5. Data Schema

Each valid record contains the following fields:

| Field | Type | Description |
|---|---|---|
| `title` | String | Book title |
| `product_url` | String | Absolute product URL |
| `price_text` | String | Original price text |
| `price_gbp` | Number | Normalized price in GBP |
| `availability_text` | String | Availability information |
| `rating_text` | String | Star rating: One to Five |
| `description` | String or null | Book description, if available |
| `source_page` | Number | Catalogue page where the book was discovered |
| `fetched_at` | String | ISO 8601 fetch timestamp |

### Example record

```json
{
  "title": "A Light in the Attic",
  "product_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "price_text": "£51.77",
  "price_gbp": 51.77,
  "availability_text": "In stock (22 available)",
  "rating_text": "Three",
  "description": "Book description...",
  "source_page": 1,
  "fetched_at": "2026-11-13T19:25:03.442Z"
}
```

The example description is shortened for documentation.

### Validation

Zod validates each normalized record before it is written to `books.json`.

- Valid records are saved in `output/books.json`.
- Invalid records and their validation errors are saved in `output/errors.json`.
- Invalid records are never included in `books.json`.

## 6. Output Files

### `books.json`

Contains validated and normalized book records.

### `errors.json`

Contains records that could not be validated or processed successfully, along with error information.

### `run-report.json`

Contains execution information:

- Run start and completion timestamps
- Execution duration
- Number of catalogue pages
- Number of discovered books
- Number of detail pages fetched from the network
- Number of cache hits
- Number of valid records
- Number of invalid records
- Failed page details

## 7. Politeness and Responsible Scraping

The scraper follows these practices:

1. Uses an identifying User-Agent.
2. Waits at least 500 milliseconds between real network requests.
3. Uses a 10-second request timeout.
4. Checks HTTP response status before parsing HTML.
5. Caches downloaded HTML to reduce repeated requests.
6. Retries eligible network failures and HTTP 5xx responses once.
7. Does not retry HTTP 403 or 404 responses.
8. Continues processing other books when an individual page fails.
9. Collects only the information required for the assignment.

The scraper does not attempt to bypass authentication, access restrictions, paywalls, or website blocks.

**Ethical note:** Prefer an official API whenever one is available. Always check a website's rules and terms
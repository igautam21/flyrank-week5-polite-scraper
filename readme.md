# FlyRank Week 5 – The Polite Scraper

A Node.js web scraping project developed for the FlyRank Backend AI Engineering Internship.

The goal is to collect 60 books from a public practice website, extract useful information, normalize the data, validate each record, and export clean JSON while following responsible web scraping practices.

## Target Classification

**Target website:** https://books.toscrape.com/

**Website type:** Public educational web scraping sandbox.

**Purpose:** Books to Scrape is a fictional bookstore created specifically for practicing web scraping. It provides publicly accessible book information without requiring authentication.

**Scope:** Only the first three catalogue pages, containing 20 books per page, and the corresponding 60 book detail pages.

**Data to collect:**
- Book title
- Product URL
- Original price text
- Availability
- Rating
- Description (if available)
- Source catalogue page
- Fetch timestamp

**Robots.txt check:** Requested `https://books.toscrape.com/robots.txt` and received HTTP 404 Not Found. No robots file was found.

**Why this target is appropriate:** The website is intentionally provided for educational scraping practice. We will limit requests, identify our scraper, respect server responses, and cache downloaded HTML.

**Commitment:** I will not reuse this code on another site without checking its rules and terms first.

## Technology Stack

- **Node.js:** JavaScript runtime
- **Cheerio:** HTML parsing
- **Zod:** Schema validation
- **Fetch API:** HTTP requests
- **JSON:** Structured output storage

## Project Stages

1. Target classification and ethical checks
2. Fetch and cache HTML
3. Discover three catalogue pages
4. Extract book details
5. Normalize and validate records
6. Handle failures and generate run reports
7. Publish code, outputs, and documentation

## Responsible Scraping Rules

- Scrape only the approved educational sandbox.
- Identify the scraper using an honest User-Agent.
- Wait at least 500 milliseconds between network requests.
- Set timeouts and check HTTP response codes.
- Cache HTML to avoid unnecessary repeated requests.
- Respect access restrictions and do not bypass blocks.
- Collect only the information required for the assignment.

## Project Status

Stage 0 – Target classification and project setup.

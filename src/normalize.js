
function normalizePrice(priceText) {
    if (typeof priceText !== "string") {
        throw new Error("Price must be a string");
    }

    const cleanedPrice = priceText
        .replace("£", "")
        .trim();

    const price = Number(cleanedPrice);

    if (!Number.isFinite(price) || price < 0) {
        throw new Error(`Invalid price: ${priceText}`);
    }

    return price;
}

module.exports = { normalizePrice };

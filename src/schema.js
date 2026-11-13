
const { z } = require("zod");

const BookSchema = z.object({
    title: z.string().min(1, "Title is required"),

    product_url: z.string().url(
        "Product URL must be a valid absolute URL"
    ),

    price_text: z.string().min(1, "Price text is required"),

    price_gbp: z.number().nonnegative(
        "Price must be a non-negative number"
    ),

    availability_text: z.string().min(
        1,
        "Availability information is required"
    ),

    rating_text: z.enum([
        "One",
        "Two",
        "Three",
        "Four",
        "Five"
    ]),

    description: z.string().nullable(),

    source_page: z.number().int().min(1).max(3),

    fetched_at: z.string().datetime()
});

module.exports = { BookSchema };

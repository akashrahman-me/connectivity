import {MongoClient} from "mongodb";
import {z} from "zod";

let client;
let db;

// Schema Validation
const entrySchema = z
    .object({
        status: z.string().optional(),
        ping: z.number().optional(),
        timestamp: z
            .string()
            .datetime()
            .optional()
            .default(() => new Date().toISOString()),
    })
    .passthrough(); // Allow other fields for now, but ensure structure for key ones

// Reuse connection between calls
async function connectDB() {
    if (!client) {
        client = new MongoClient(process.env.MONGO_URI || "mongodb+srv://dbUser:dbUserPassword@cluster0.uqgjsgx.mongodb.net/");
        await client.connect();
        db = client.db("connectivity_logs");
    }
    return db;
}

// Helper to handle CORS
const allowCors = (fn) => async (req, res) => {
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }
    return await fn(req, res);
};

export default allowCors(async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).end();
    }

    try {
        // Extract data source: Query Params + Bearer Token
        let tokenData = {};
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            try {
                // Try 1: Is the token just a raw JSON string?
                tokenData = JSON.parse(token);
            } catch (e) {
                try {
                    // Try 2: Is it a Base64 encoded JSON string?
                    const decoded = Buffer.from(token, "base64").toString("utf-8");
                    tokenData = JSON.parse(decoded);
                } catch (e2) {
                    // Fallback: Just save the raw token as a 'token' field if it's not JSON
                    // This creates a record even if parsing fails, useful for debugging
                    tokenData = {raw_token: token};
                }
            }
        } else {
            // Require Auth if that's the requirement, or just proceed with query
            // Based on user request "expect a authentication header", strictly enforcing it is safer:
            return res.status(401).end();
        }

        // Merge query params (e.g., ?ping=20) with token data
        // Query params override token data if both exist
        const rawInput = {...tokenData, ...req.query};

        // Convert ping to number if it came from query strings
        if (rawInput.ping && typeof rawInput.ping === "string") {
            rawInput.ping = Number(rawInput.ping);
        }

        // Validate input
        const parseResult = entrySchema.safeParse(rawInput);

        if (!parseResult.success) {
            return res.status(400).end();
        }

        const db = await connectDB();

        // Check for duplicate token usage
        // We use the raw token string as the unique identifier
        const rawToken = authHeader.substring(7);
        const existingEntry = await db.collection("entries").findOne({raw_token: rawToken});

        if (existingEntry) {
            return res.status(409).end();
        }

        const data = parseResult.data;
        // Add the raw token to the data so we can check it next time
        const cleanData = {
            ...data,
            raw_token: rawToken,
        };

        await db.collection("entries").insertOne(cleanData);

        return res.status(200).end();
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).end();
    }
});

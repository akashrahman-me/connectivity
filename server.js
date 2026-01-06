import express from "express";
import dotenv from "dotenv";
import connectivityHandler from "./api/connectivity.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Adapt Vercel-style handler to Express
const adapter = (handler) => async (req, res) => {
    // Vercel helpers for res (status, json are standard in Express but good to ensure compatibility)
    try {
        await handler(req, res);
    } catch (err) {
        console.error("Unhandled Error:", err);
        if (!res.headersSent) {
            res.status(500).end();
        }
    }
};

app.get("/api/connectivity", adapter(connectivityHandler));

app.get("/", (req, res) => {
    res.send("Internet Connectivity API");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

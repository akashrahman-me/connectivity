# Internet Connectivity API

A simple serverless API to log internet connectivity stats to MongoDB.

## Setup

1. **Install Dependencies**

    ```bash
    npm install
    ```

2. **Environment Variables**
   Create a `.env` file locally:

    ```
    MONGO_URI=mongodb://localhost:27017
    DB_NAME=connectivity_logs
    ```

3. **Run Locally**
    ```bash
    npm run dev
    ```

## Deployment to Vercel

1. **Push to GitHub/GitLab/Bitbucket**.
2. **Import Project** into Vercel.
3. **Configure Environment Variables** in the Vercel Project Settings:
    - `MONGO_URI`: Your production MongoDB Connection String (e.g., from MongoDB Atlas).
    - `DB_NAME`: Your production database name.
4. **Deploy**.

## API

### GET `/api/connectivity`

Logs a connectivity entry via authentication token or query params.

**Authentication:**
Bearer Header containing a JSON token or Base64 encoded JSON token.

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/connectivity \
  -H "Authorization: Bearer eyJzdGF0dXMiOiJvbmxpbmUifQ=="
```

**Responses:**

-   `200 OK`: Saved successfully.
-   `409 Conflict`: Duplicate token.
-   `401 Unauthorized`: Missing token.
-   `400 Bad Request`: Invalid data.

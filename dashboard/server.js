import express from "express";
import cors from "cors";
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for any localhost port during development
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Serve static files from React build
app.use(express.static(path.join(__dirname, "dist")));

// Google Sheets API setup
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const SHEET_ID = "1cwRV3AGiQmT_TkBwXozxAw_ezD1Yw4m5tsr-AJl3AKU";

// Initialize Google Sheets API
let sheets = null;
let lastDataHash = null;
let lastUpdateTime = null;
let cachedData = null;

// Auto-refresh configuration
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
const MAX_CACHE_AGE = 60000; // 1 minute

async function initializeGoogleSheets() {
  try {
    // You'll need to provide these credentials
    const auth = new google.auth.GoogleAuth({
      keyFile: "./google-credentials.json", // Path to your service account key file
      scopes: SCOPES,
    });

    sheets = google.sheets({ version: "v4", auth });
    console.log("✅ Google Sheets API initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing Google Sheets API:", error.message);
    console.log(
      "📝 Please ensure you have google-credentials.json file in the project root"
    );
  }
}

// Generate a hash of the data to detect changes
function generateDataHash(data) {
  if (!data || data.length === 0) return null;

  // Create a simple hash based on row count and last few values
  const lastRow = data[data.length - 1];
  const hashData = `${data.length}-${JSON.stringify(lastRow).slice(0, 100)}`;
  return Buffer.from(hashData).toString("base64");
}

// Fetch data from Google Sheets with caching
async function fetchSheetData(forceRefresh = false) {
  try {
    if (!sheets) {
      throw new Error("Google Sheets API not initialized");
    }

    // Check if we have recent cached data
    const now = Date.now();
    if (
      !forceRefresh &&
      cachedData &&
      lastUpdateTime &&
      now - lastUpdateTime < MAX_CACHE_AGE
    ) {
      console.log(
        "📋 Using cached data (age:",
        Math.round((now - lastUpdateTime) / 1000),
        "seconds)"
      );
      return cachedData;
    }

    console.log("📊 Fetching fresh data from Google Sheets...");

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:Z", // Get all columns
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return { data: [], updated: false };
    }

    // Convert to CSV format for Papa Parse compatibility
    const headers = rows[0];
    const csvData = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    // Generate hash to detect changes
    const newHash = generateDataHash(csvData);
    const hasChanged = newHash !== lastDataHash;

    if (hasChanged) {
      console.log(
        `🔄 Data changed! Fetched ${csvData.length} rows from Google Sheets`
      );
      console.log(`📅 Last update: ${new Date().toLocaleString()}`);
      lastDataHash = newHash;
      lastUpdateTime = now;
      cachedData = { data: csvData, updated: true };
    } else {
      console.log(`📋 No changes detected. Still ${csvData.length} rows`);
      cachedData = { data: csvData, updated: false };
    }

    return cachedData;
  } catch (error) {
    console.error("❌ Error fetching sheet data:", error.message);
    throw error;
  }
}

// API endpoint to fetch sheet data
app.get("/api/sheet-data", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const result = await fetchSheetData(forceRefresh);

    res.json({
      data: result.data,
      updated: result.updated,
      lastUpdate: lastUpdateTime
        ? new Date(lastUpdateTime).toISOString()
        : null,
      totalRows: result.data.length,
    });
  } catch (error) {
    console.error("❌ Error in sheet-data endpoint:", error.message);
    res.status(500).json({
      error: "Failed to fetch data from Google Sheets",
      details: error.message,
    });
  }
});

// API endpoint to check for updates
app.get("/api/check-updates", async (req, res) => {
  try {
    const result = await fetchSheetData(false); // Don't force refresh for check

    res.json({
      hasUpdates: result.updated,
      lastUpdate: lastUpdateTime
        ? new Date(lastUpdateTime).toISOString()
        : null,
      totalRows: result.data.length,
      dataHash: lastDataHash,
    });
  } catch (error) {
    console.error("❌ Error checking for updates:", error.message);
    res.status(500).json({
      error: "Failed to check for updates",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    sheetsInitialized: !!sheets,
    lastUpdate: lastUpdateTime ? new Date(lastUpdateTime).toISOString() : null,
    totalRows: cachedData ? cachedData.data.length : 0,
    autoRefreshInterval: AUTO_REFRESH_INTERVAL / 1000 + " seconds",
  });
});

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Initialize Google Sheets and start server
async function startServer() {
  await initializeGoogleSheets();

  // Initial data fetch
  try {
    await fetchSheetData(true);
  } catch (error) {
    console.log("⚠️ Initial data fetch failed, will retry on first request");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/sheet-data`);
    console.log(`🔄 Update check: http://localhost:${PORT}/api/check-updates`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(
      `⏰ Auto-refresh: Every ${AUTO_REFRESH_INTERVAL / 1000} seconds`
    );
  });
}

startServer().catch(console.error);

const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");

const app = express();

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

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const SHEET_ID = "1cwRV3AGiQmT_TkBwXozxAw_ezD1Yw4m5tsr-AJl3AKU";

let sheets = null;
let lastDataHash = null;
let lastUpdateTime = null;
let cachedData = null;

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
const MAX_CACHE_AGE = 60000; // 1 minute

async function initializeGoogleSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, "../google-credentials.json"),
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

function generateDataHash(data) {
  if (!data || data.length === 0) return null;
  const lastRow = data[data.length - 1];
  const hashData = `${data.length}-${JSON.stringify(lastRow).slice(0, 100)}`;
  return Buffer.from(hashData).toString("base64");
}

async function fetchSheetData(forceRefresh = false) {
  try {
    if (!sheets) {
      await initializeGoogleSheets();
      if (!sheets) throw new Error("Google Sheets API not initialized");
    }
    const now = Date.now();
    if (
      !forceRefresh &&
      cachedData &&
      lastUpdateTime &&
      now - lastUpdateTime < MAX_CACHE_AGE
    ) {
      return cachedData;
    }
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:Z",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { data: [], updated: false };
    }
    const headers = rows[0];
    const csvData = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });
    const newHash = generateDataHash(csvData);
    const hasChanged = newHash !== lastDataHash;
    if (hasChanged) {
      lastDataHash = newHash;
      lastUpdateTime = now;
      cachedData = { data: csvData, updated: true };
    } else {
      cachedData = { data: csvData, updated: false };
    }
    return cachedData;
  } catch (error) {
    console.error("❌ Error fetching sheet data:", error.message);
    throw error;
  }
}

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
    res.status(500).json({
      error: "Failed to fetch data from Google Sheets",
      details: error.message,
    });
  }
});

app.get("/api/check-updates", async (req, res) => {
  try {
    const result = await fetchSheetData(false);
    res.json({
      hasUpdates: result.updated,
      lastUpdate: lastUpdateTime
        ? new Date(lastUpdateTime).toISOString()
        : null,
      totalRows: result.data.length,
      dataHash: lastDataHash,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to check for updates",
      details: error.message,
    });
  }
});

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

module.exports = app;

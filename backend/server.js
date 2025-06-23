const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");

const app = express();

// CORS configuration with allowed origins
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  "https://algo-trading-platform-bay.vercel.app",
  "https://algo-trading-platform-3ouq.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.some((allowedOrigin) =>
          typeof allowedOrigin === "string"
            ? allowedOrigin === origin
            : allowedOrigin.test(origin)
        )
      ) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Google Sheets API setup
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
      credentials: {
        type: "service_account",
        project_id: "ocr-app-4e26c",
        private_key_id: "4f6ffe94e1d32e8a88af690ac14920e4cc0138bb",
        private_key: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDchikL0yPNPT6/
GnRgMFSfeJAyFicA/GF+58duQwroErRQ882/2tcjWY8OIVgCJdvpM7tphzwzWsy2
9bkard2ApRswfK0oxSx/j0ymcYqYd0sYa6+zKCceC3N1j/4p5A2UhJ7SXYj1DENe
IFnYcDL/0WI3/xo1Kpyku8WPw0/XCVs40GViPG31udcyTwzNur7k8fHt2AQ4We6J
CwUuMVYfmQ9MDFZf33PTmXYehF5GMJcTEsVZEnuLqHgtY5NZ//CH7iIyqVRJdNCK
irfEwNmaiqZLLKehs8ZCoB590Nt327DYvEDFXJdqU/yqyfVaOK3cJ/tkrktIhVG4
Uy4Csm8DAgMBAAECggEABAqNXAMdh9hUewoQEecw1c9OzSwswM7fNoUm2XVvELuv
BEDDh32KLcKpZXfk9f0dn5NsHs30o3hJghzUrJF9Gqtr6SKPxcx/OUM2A2LXSF3/
SU5H5P+aX+mTzxa5cKkWOp+HjZFbPipgXaw4GUhNFvUOWLpbD5hdUIOEZlMM9oLT
rLRnWNYOde8u0bhEv/teh54sZRVpfYAVnt+Gil0n5xKywOGM1CnPKJQYzs4+maeo
gaS+uEvVVc1PTtMa6mJd2Qtwg2R63zUcI0k1w0FczRhfFmCGgtRPiQ6mDNlIhQ8d
EDzasNvp32OxdBAuN5acQKaHyIWAHz4JWLcxM3PWcQKBgQDvZls/73V2PFIadEn6
KbsBD+VqSyd1/678/Bw81YGS16qK/bX4z28wVquNFNR4pG4O8uzlDfvvzW8gcJIL
opB43VuospCMs3cCXwN3T+qgri3S9vmYVl19rfRJal3bBUYbGhtlpjqQJhgkAuKe
8kulv06c0cKvu0B66imOK5YaewKBgQDr0LxUSp4xEKlxF71aNSHzVkjZpUnnw/L2
43Fb363JoHn1J7EEvUdE5b9cKaY37nDb1NmzvCfj2qY96sWmF+9Pt/CSDJFekRe8
m1xlqNHye/4lO/tzME3kiETa8DUbqJdDmtXyaqyjBM5RWpsuYcf5/SKaPxb0R4h/
QEyZhXa7GQKBgBFvbfPhF7fturkMgRrEEUeJhdbQ9GXGolLwdYoErrQoGtaWlbsy
OFHX7hSPUM4cg5t5G8Gu3Ath9dbx++D3DPiQfo1xu89TfrZgfxsgaeEb7mBv9kue
9p4hnin+oilCYBG3PAmSKq+25okw4Jpc4R+IKEyJhllQFOkexroA+KSjAoGAf9yz
cQTwl2wQY+jaW+I5YWbko1ZzJz7hK6sRWR6EbbIczqfR3N8AmMP2KXPP073u5dOY
o1MfUfXJdAMrXi7WLKRwxdAYtmz3sOWQiPKru84tdGT8p22GnqagpxHdyfx04ExB
O2tJ5i6B7Cyzvcd5FfyCWZ5hxNxQj6b+obNzOGkCgYACe7PLJXBwrpkqybaUyHem
vL4/xPNXwo3KwVZLeuSKpr6ogNi6j1+jtdIYkNGVyM6ivCVwIzqfuJKGA9Pia4wt
QeN7OKp2gePTEQVC/+lUhvgIU3UunZV4+NfE9p9r51BPv3d8fsPClAjt5TFKmSXy
HvF/EEfMVs5H+FNOoltFVA==
-----END PRIVATE KEY-----
`,
        client_email:
          "trading-dashboard-api@ocr-app-4e26c.iam.gserviceaccount.com",
        client_id: "101027014457745639747",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url:
          "https://www.googleapis.com/robot/v1/metadata/x509/trading-dashboard-api%40ocr-app-4e26c.iam.gserviceaccount.com",
        universe_domain: "googleapis.com",
      },
      scopes: SCOPES,
    });
    sheets = google.sheets({ version: "v4", auth });
    console.log("✅ Google Sheets API initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing Google Sheets API:", error.message);
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
      range: "Sheet1!A:AJ",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error("No data found in the sheet");
    }
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      return obj;
    });
    const newHash = generateDataHash(data);
    const hasChanged = newHash !== lastDataHash;
    if (hasChanged) {
      lastDataHash = newHash;
      lastUpdateTime = now;
      cachedData = data;
    }
    return cachedData;
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
}

app.get("/api/sheet-data", async (req, res) => {
  try {
    if (!sheets) {
      await initializeGoogleSheets();
    }

    // Check if we have cached data that's still fresh
    if (
      cachedData &&
      lastUpdateTime &&
      Date.now() - lastUpdateTime < MAX_CACHE_AGE
    ) {
      return res.json(cachedData);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:AJ",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error("No data found in the sheet");
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      return obj;
    });

    // Update cache
    cachedData = data;
    lastUpdateTime = Date.now();
    lastDataHash = JSON.stringify(data);

    res.json(data);
  } catch (error) {
    console.error("Error fetching sheet data:", error);
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

// Add port configuration
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  initializeGoogleSheets();
});

module.exports = app;

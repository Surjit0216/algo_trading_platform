const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const SHEET_ID = "1cwRV3AGiQmT_TkBwXozxAw_ezD1Yw4m5tsr-AJl3AKU";

// Fetch a sheet tab as CSV from public Google Sheet (no auth needed)
async function fetchSheetCSV(tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet "${tabName}" not found or not public (${res.status})`);
  return res.text();
}

// Parse CSV text into array of objects using first row as headers
function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const values = [];
    let current = "", inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
}

let cache = null;
let cacheTime = 0;
const CACHE_MS = 60_000; // 1 minute

async function getData(force = false) {
  if (!force && cache && Date.now() - cacheTime < CACHE_MS) return cache;
  const [csv1, csv2] = await Promise.all([
    fetchSheetCSV("Sheet1"),
    fetchSheetCSV("Archive").catch(() => ""), // Archive tab optional
  ]);
  const sheet1 = parseCSV(csv1).map(r => ({ ...r, _source: "Sheet1" }));
  const archive = csv2 ? parseCSV(csv2).map(r => ({ ...r, _source: "Archive" })) : [];
  cache = [...archive, ...sheet1];
  cacheTime = Date.now();
  return cache;
}

app.get("/api/sheet-data", async (req, res) => {
  try {
    const data = await getData(req.query.refresh === "true");
    res.json({ data, total: data.length, lastUpdate: new Date(cacheTime).toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/check-updates", async (req, res) => {
  try {
    const data = await getData();
    res.json({ totalRows: data.length, lastUpdate: new Date(cacheTime).toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", cached: !!cache, totalRows: cache?.length || 0, lastUpdate: cacheTime ? new Date(cacheTime).toISOString() : null });
});

module.exports = app;

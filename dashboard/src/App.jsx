// Main dashboard application
import { useEffect, useState, useCallback, useRef } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Summary from "./components/Summary";
import Filters from "./components/Filters";
import TradeTable from "./components/TradeTable";
import TradeModal from "./components/TradeModal";
import Charts from "./components/Charts";
import { PriceService, PriceDisplay } from "./components/PriceService";
import AnalysisDashboard from "./components/AnalysisDashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Parse trade date strings (supports dd-mm-yyyy, dd-mm-yy, dd/mm/yyyy, yyyy-mm-dd, with optional time)
function parseTradeDate(dateStr) {
  if (!dateStr) return null;
  // Strip time portion e.g. "11-03-2026 9:25 AM" → "11-03-2026"
  const s = String(dateStr).trim().split(/\s/)[0];
  const parts = s.split(/[-\/]/);
  if (parts.length !== 3) return null;
  let day, month, year;
  if (parts[0].length === 4) {
    [year, month, day] = parts; // yyyy-mm-dd
  } else {
    [day, month, year] = parts; // dd-mm-yyyy or dd-mm-yy
  }
  let y = Number(year);
  if (y < 100) y += 2000; // fix 2-digit years (e.g. "26" → 2026)
  const d = new Date(y, Number(month) - 1, Number(day));
  return isNaN(d.getTime()) ? null : d;
}

// Strip currency formatting from Google Sheets (₹25,268 → 25268)
function cleanNum(val) {
  if (val === undefined || val === null || val === "") return "";
  return String(val).replace(/[₹,%\s]/g, "").replace(/,/g, "");
}

function getMonthLabel(dateStr) {
  const d = parseTradeDate(dateStr);
  if (!d) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// API configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const SHEET_DATA_URL = `${API_URL}/api/sheet-data`;
const CHECK_UPDATES_URL = `${API_URL}/api/check-updates`;
const SAMPLE_DATA_URL = "/sample-data.csv";

// Auto-refresh configuration
const UPDATE_CHECK_INTERVAL = 10000; // 10 seconds

function App() {
  const [trades, setTrades] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({ indexes: [], timeframes: [], months: [] });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState("light");
  const [sortKey, setSortKey] = useState("Signal Date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Refs for intervals
  const updateCheckIntervalRef = useRef(null);
  const lastDataHashRef = useRef(null);
  const loadDataRef = useRef(null);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (isRefreshing && !forceRefresh) return; // Prevent multiple simultaneous requests

        setIsRefreshing(true);
        setError(null);
        setUsingSampleData(false);

        // Try to load from backend API first
        const url = forceRefresh
          ? `${SHEET_DATA_URL}?refresh=true`
          : SHEET_DATA_URL;
        console.log("Attempting to load from:", url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch data: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        const CURRENCY_FIELDS = ["Profit (INR)", "ROI % on Capital", "ROI", "% Move Captured"];
        const clean = result.data
          .filter((row) =>
            Object.values(row).some((v) => v !== "" && v !== null && v !== undefined)
          )
          .map((row) => {
            const r = { ...row };
            CURRENCY_FIELDS.forEach((f) => { if (r[f] !== undefined) r[f] = cleanNum(r[f]); });
            return r;
          });

        // Update last data hash for change detection
        lastDataHashRef.current = result.dataHash || null;

        console.log(
          "Successfully loaded",
          clean.length,
          "trades from Google Sheets via API"
        );

        if (result.updated) {
          console.log("🔄 Data was updated!");
          setLastUpdate(result.lastUpdate);
        }

        setTrades(clean);
        setFiltered(clean);
        computeMetrics(clean);
        const months = Array.from(
          new Set(clean.map((r) => getMonthLabel(r["Signal Date"] || r["Date"])).filter(Boolean))
        ).sort((a, b) => new Date(b) - new Date(a));
        setOptions({
          indexes: Array.from(
            new Set(clean.map((r) => r.Index).filter(Boolean))
          ).sort(),
          timeframes: Array.from(
            new Set(clean.map((r) => r.Timeframe).filter(Boolean))
          ).sort(),
          months,
        });
      } catch (err) {
        console.warn("Error loading from API:", err.message);

        // Fallback to sample data
        try {
          console.log("Loading sample data...");
          const sampleResponse = await fetch(SAMPLE_DATA_URL);
          if (!sampleResponse.ok) {
            throw new Error("Sample data not available");
          }

          const sampleText = await sampleResponse.text();

          // Parse CSV manually since we're not using Papa Parse for sample data
          const lines = sampleText.split("\n");
          const headers = lines[0].split(",");
          const csvData = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              const values = line.split(",");
              const obj = {};
              headers.forEach((header, index) => {
                obj[header.trim()] = values[index] ? values[index].trim() : "";
              });
              return obj;
            });

          setTrades(csvData);
          setFiltered(csvData);
          computeMetrics(csvData);
          setOptions({
            indexes: Array.from(
              new Set(csvData.map((r) => r.Index).filter(Boolean))
            ).sort(),
            timeframes: Array.from(
              new Set(csvData.map((r) => r.Timeframe).filter(Boolean))
            ).sort(),
          });
          setUsingSampleData(true);
          setError(null);
        } catch (sampleErr) {
          console.error("Error loading sample data:", sampleErr);
          setError("Unable to load data. Please check your API configuration.");
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [] // Remove isRefreshing dependency to prevent infinite loop
  );

  // Store loadData in ref to avoid dependency loops
  loadDataRef.current = loadData;

  // Check for updates without full refresh
  const checkForUpdates = useCallback(async () => {
    if (!autoRefreshEnabled || usingSampleData) return;

    try {
      const response = await fetch(CHECK_UPDATES_URL);
      if (!response.ok) return;

      const result = await response.json();

      if (result.hasUpdates && result.dataHash !== lastDataHashRef.current) {
        console.log("🔄 Updates detected! Refreshing data...");
        await loadDataRef.current(true);
      }
    } catch (error) {
      console.log("Update check failed:", error.message);
    }
  }, [autoRefreshEnabled, usingSampleData]); // Remove loadData dependency

  // Set up auto-refresh intervals
  useEffect(() => {
    if (autoRefreshEnabled && !usingSampleData) {
      // Check for updates every 10 seconds
      updateCheckIntervalRef.current = setInterval(
        checkForUpdates,
        UPDATE_CHECK_INTERVAL
      );

      return () => {
        if (updateCheckIntervalRef.current) {
          clearInterval(updateCheckIntervalRef.current);
        }
      };
    }
  }, [autoRefreshEnabled, usingSampleData, checkForUpdates]);

  // Initial data load - only run once on mount
  useEffect(() => {
    loadDataRef.current();
  }, []);

  const computeMetrics = (data) => {
    if (!data || data.length === 0) {
      setMetrics(null);
      return;
    }

    const totalTrades = data.length;
    const wins = data.filter(
      (row) => parseFloat(row["Profit (INR)"] || 0) > 0
    ).length;
    const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(2) : 0;
    const averageROI = totalTrades
      ? (
          data.reduce(
            (sum, r) =>
              sum + parseFloat(r["ROI % on Capital"] || r["ROI"] || 0),
            0
          ) / totalTrades
        ).toFixed(2)
      : 0;
    const totalProfit = data
      .reduce((sum, r) => sum + parseFloat(r["Profit (INR)"] || 0), 0)
      .toFixed(2);
    const avgDuration = totalTrades
      ? (
          data.reduce(
            (sum, r) =>
              sum + parseFloat(r["Trade Duration"] || r["TimeTaken"] || 0),
            0
          ) / totalTrades
        ).toFixed(2)
      : 0;

    const targetSuccess = {};
    ["T1Hit", "T2Hit", "T3Hit", "T4Hit", "T5Hit", "T6Hit"].forEach((t) => {
      const hit = data.filter(
        (r) => String(r[t] || "").toLowerCase() === "true"
      ).length;
      targetSuccess[t] = totalTrades
        ? ((hit / totalTrades) * 100).toFixed(2)
        : 0;
    });

    setMetrics({
      totalTrades,
      winRate,
      averageROI,
      totalProfit,
      averageDuration: avgDuration,
      targetSuccess,
    });
  };

  const applyFilters = useCallback(() => {
    let data = [...trades];

    if (filters.search) {
      data = data.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters.index) {
      data = data.filter((row) => row.Index === filters.index);
    }
    if (filters.timeframe) {
      data = data.filter((row) => row.Timeframe === filters.timeframe);
    }
    if (filters.signal) {
      data = data.filter((row) => row.Signal === filters.signal);
    }
    if (filters.pnl === "profit") {
      data = data.filter((row) => parseFloat(row["Profit (INR)"] || 0) > 0);
    } else if (filters.pnl === "loss") {
      data = data.filter((row) => parseFloat(row["Profit (INR)"] || 0) <= 0);
    }
    if (filters.source) {
      data = data.filter((row) => row._source === filters.source);
    }
    if (filters.month) {
      data = data.filter((row) => {
        const label = getMonthLabel(row["Signal Date"] || row["Date"]);
        return label === filters.month;
      });
    }

    setFiltered(data);
    computeMetrics(data);
  }, [filters, trades]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleManualRefresh = () => {
    loadDataRef.current(true);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  // Sorting logic
  const getSortedTrades = (data) => {
    if (!data) return [];
    const sorted = [...data].sort((a, b) => {
      let aVal = a[sortKey] || "";
      let bVal = b[sortKey] || "";
      // For date fields, parse using our helper
      if (sortKey === "Signal Date" || sortKey === "Date") {
        aVal = parseTradeDate(a["Signal Date"] || a["Date"]) || new Date(0);
        bVal = parseTradeDate(b["Signal Date"] || b["Date"]) || new Date(0);
      } else if (sortKey === "Profit (INR)" || sortKey === "ROI") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const sortedFiltered = getSortedTrades(filtered);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
          <p className="text-muted-foreground">Loading Trading Data...</p>
        </div>
      </div>
    );
  }

  if (error && !usingSampleData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 p-8 border rounded-lg shadow-md bg-card">
          <h2 className="text-lg font-semibold text-destructive">
            Error Loading Data
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => loadDataRef.current(true)}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <PriceService>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 shadow-xl">
          <div className="container flex items-center h-16 gap-4">
            {/* Logo / Title */}
            <div className="flex items-center gap-3 mr-4 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
                  Preeto Trading
                </h1>
                <p className="text-[10px] font-medium text-indigo-300 leading-none mt-0.5 uppercase tracking-widest">
                  Live Journal
                </p>
              </div>
            </div>

            {/* Status pill */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 border border-white/10">
              {usingSampleData ? (
                <><span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />Sample Data</>
              ) : isRefreshing ? (
                <><span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />Refreshing…</>
              ) : (
                <><span className="h-2 w-2 rounded-full bg-emerald-400" />Live · {formatLastUpdate(lastUpdate)}</>
              )}
            </div>

            <div className="flex items-center justify-end flex-1 space-x-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onCheckedChange={toggleAutoRefresh}
                  disabled={usingSampleData}
                />
                <label
                  htmlFor="auto-refresh"
                  className="text-xs text-white/60 hidden sm:block"
                >
                  Auto
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs"
              >
                {isRefreshing ? "⏳" : "🔄"} Refresh
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 h-8 w-8"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-8">
          <Summary metrics={metrics} trades={trades} />

          {/* Trade History at the top */}
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>
                Browse and filter your executed trades with real-time P&L
                updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Sorting controls */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <label htmlFor="sortKey" className="text-sm">
                  Sort by:
                </label>
                <select
                  id="sortKey"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="Signal Date">Signal Date</option>
                  <option value="Profit (INR)">P&L</option>
                  <option value="ROI">ROI</option>
                  <option value="Index">Index</option>
                  <option value="Signal">Signal</option>
                </select>
                <button
                  className="ml-2 px-2 py-1 border rounded text-sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? "⬆️" : "⬇️"}
                </button>
              </div>
              <Filters
                filters={filters}
                setFilters={setFilters}
                options={options}
              />
              <TradeTable data={sortedFiltered} onSelect={setSelected} />
            </CardContent>
          </Card>

          {/* Live Market Prices */}
          <div className="mt-8">
            <PriceDisplay />
          </div>

          <div className="grid gap-8 mt-8">
            <Charts data={filtered} theme={theme} />
            {/* Portfolio Analysis Dashboard */}
            <AnalysisDashboard data={filtered} metrics={metrics} />
          </div>
          <TradeModal trade={selected} onClose={() => setSelected(null)} />
        </main>
      </div>
    </PriceService>
  );
}

export default App;

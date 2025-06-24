import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  Percent,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Zap,
} from "lucide-react";
import {
  getBestSetups,
  computeTargetFunnel,
  profitByHour,
  computeDrawdown,
  computeSetupStats,
  profitVsDuration,
} from "../lib/utils";
import { Scatter, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title
);

function SetupPerformanceTable({ stats }) {
  return (
    <table className="min-w-full text-sm border">
      <thead>
        <tr>
          <th className="px-2 py-1 border">Setup</th>
          <th className="px-2 py-1 border">Win Rate (%)</th>
          <th className="px-2 py-1 border">Avg Profit</th>
          <th className="px-2 py-1 border">Trades</th>
        </tr>
      </thead>
      <tbody>
        {stats.map((s) => (
          <tr key={s.key}>
            <td className="border px-2 py-1">{s.key}</td>
            <td className="border px-2 py-1">{s.winRate.toFixed(1)}</td>
            <td className="border px-2 py-1">₹{s.avgProfit.toFixed(0)}</td>
            <td className="border px-2 py-1">{s.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TargetFunnel({ funnel }) {
  return (
    <div className="flex gap-2 items-end">
      {funnel.map((t) => (
        <div key={t.target} className="flex flex-col items-center">
          <div className="bg-blue-500 text-white rounded px-2 py-1 mb-1">
            {t.target}
          </div>
          <div className="font-bold">{t.hitRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">{t.hitCount} hits</div>
        </div>
      ))}
    </div>
  );
}

function BestSetupsTable({ setups }) {
  return (
    <table className="min-w-full text-sm border">
      <thead>
        <tr>
          <th className="px-2 py-1 border">Setup</th>
          <th className="px-2 py-1 border">Win Rate (%)</th>
          <th className="px-2 py-1 border">Avg Profit</th>
          <th className="px-2 py-1 border">Trades</th>
        </tr>
      </thead>
      <tbody>
        {setups.map((s) => (
          <tr key={s.key}>
            <td className="border px-2 py-1">{s.key}</td>
            <td className="border px-2 py-1">{s.winRate.toFixed(1)}</td>
            <td className="border px-2 py-1">₹{s.avgProfit.toFixed(0)}</td>
            <td className="border px-2 py-1">{s.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const InsightsSection = ({ trades }) => {
  const setupStats = useMemo(() => computeSetupStats(trades), [trades]);
  const funnel = useMemo(() => computeTargetFunnel(trades), [trades]);
  const bestSetups = useMemo(() => getBestSetups(setupStats, 5), [setupStats]);
  const profitDuration = useMemo(() => profitVsDuration(trades), [trades]);
  const profitHour = useMemo(() => profitByHour(trades), [trades]);
  const drawdownSeries = useMemo(() => computeDrawdown(trades), [trades]);

  const scatterData = {
    datasets: [
      {
        label: "Profit vs. Trade Duration",
        data: profitDuration.map((d) => ({ x: d.duration, y: d.profit })),
        backgroundColor: "rgba(0, 123, 255, 0.7)",
      },
    ],
  };
  const scatterOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `Duration: ${ctx.parsed.x}m, Profit: ₹${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Trade Duration (minutes)" },
      },
      y: {
        title: { display: true, text: "Profit (INR)" },
      },
    },
  };

  const barData = {
    labels: profitHour.map((d) => `${d.hour}:00`),
    datasets: [
      {
        label: "Avg Profit",
        data: profitHour.map((d) => d.avgProfit),
        backgroundColor: "rgba(76, 175, 80, 0.7)",
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `Hour: ${ctx.label}, Avg Profit: ₹${ctx.parsed.y.toFixed(0)}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Hour of Day (Entry)" } },
      y: { title: { display: true, text: "Avg Profit (INR)" } },
    },
  };

  const lineData = {
    labels: drawdownSeries.map((_, i) => i + 1),
    datasets: [
      {
        label: "Equity Curve",
        data: drawdownSeries.map((d) => d.equity),
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.1)",
        yAxisID: "y",
        tension: 0.2,
      },
      {
        label: "Drawdown",
        data: drawdownSeries.map((d) => d.drawdown),
        borderColor: "#ff6b6b",
        backgroundColor: "rgba(255,107,107,0.1)",
        yAxisID: "y1",
        tension: 0.2,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(0)}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Trade #" } },
      y: { title: { display: true, text: "Equity (INR)" }, position: "left" },
      y1: {
        title: { display: true, text: "Drawdown (INR)" },
        position: "right",
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <Card className="mb-8 border-2 border-blue-400 bg-blue-50/30">
      <CardHeader>
        <CardTitle>📊 Trading Insights & Proven Edges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">
            Setup Performance{" "}
            <span title="Win rate and average profit by setup">ℹ️</span>
          </h4>
          <SetupPerformanceTable stats={setupStats} />
        </div>
        <div>
          <h4 className="font-semibold mb-2">
            Target Hit Funnel{" "}
            <span title="% of trades reaching each target">ℹ️</span>
          </h4>
          <TargetFunnel funnel={funnel} />
        </div>
        <div>
          <h4 className="font-semibold mb-2">
            Best Setups{" "}
            <span title="Top 5 setups by win rate and profit">ℹ️</span>
          </h4>
          <BestSetupsTable setups={bestSetups} />
        </div>
        <div>
          <h4 className="font-semibold mb-2">
            Profit vs. Trade Duration{" "}
            <span title="See if holding longer = more profit">ℹ️</span>
          </h4>
          <div className="bg-white rounded p-4 border">
            <Scatter data={scatterData} options={scatterOptions} height={250} />
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">
            Profit by Time of Day{" "}
            <span title="See which hours are most/least profitable">ℹ️</span>
          </h4>
          <div className="bg-white rounded p-4 border">
            <Bar data={barData} options={barOptions} height={250} />
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">
            Drawdown & Equity Curve{" "}
            <span title="See your equity growth and risk over time">ℹ️</span>
          </h4>
          <div className="bg-white rounded p-4 border">
            <Line data={lineData} options={lineOptions} height={250} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function StrategyPlaybook({ trades }) {
  const [filter, setFilter] = useState({
    signal: "",
    index: "",
    timeframe: "",
  });
  const [sortKey, setSortKey] = useState("winRate");
  const [sortOrder, setSortOrder] = useState("desc");
  const setupStats = useMemo(
    () => getBestSetups(trades.length > 0 ? computeSetupStats(trades) : [], 10),
    [trades]
  );

  // Filtered strategies
  const filtered = setupStats.filter(
    (s) =>
      (!filter.signal || s.key.includes(filter.signal)) &&
      (!filter.index || s.key.includes(filter.index)) &&
      (!filter.timeframe || s.key.includes(filter.timeframe))
  );

  // Helper to get most common target hit for a group
  function mostCommonTarget(group) {
    let max = 0,
      best = "-";
    for (let i = 1; i <= 6; ++i) {
      const hit = group.filter(
        (t) => String(t[`T${i}Hit`] || "").toLowerCase() === "true"
      ).length;
      if (hit > max) {
        max = hit;
        best = `T${i}`;
      }
    }
    return best;
  }

  // Helper to get best hour for a group
  function bestHour(group) {
    const byHour = {};
    group.forEach((t) => {
      const entry = t["Entry Timestamp (UTC)"] || t["Date"] || "";
      const hour = entry.match(/\b(\d{1,2}):/)
        ? parseInt(entry.match(/\b(\d{1,2}):/)[1], 10)
        : null;
      if (hour !== null) {
        if (!byHour[hour]) byHour[hour] = 0;
        byHour[hour]++;
      }
    });
    const best = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
    return best ? `${best[0]}:00` : "-";
  }

  // Helper to get drawdown stats for a group
  function drawdownStats(group) {
    const series = computeDrawdown(group);
    const min = Math.min(...series.map((d) => d.drawdown));
    return min;
  }

  // Prepare data with derived fields for sorting
  const tableData = filtered.map((s) => ({
    ...s,
    mostCommonTarget: mostCommonTarget(s.group),
    bestHour: bestHour(s.group),
    drawdown: drawdownStats(s.group),
  }));

  // Sorting logic
  const sorted = [...tableData].sort((a, b) => {
    let vA, vB;
    switch (sortKey) {
      case "winRate":
        vA = a.winRate;
        vB = b.winRate;
        break;
      case "avgProfit":
        vA = a.avgProfit;
        vB = b.avgProfit;
        break;
      case "count":
        vA = a.count;
        vB = b.count;
        break;
      case "mostCommonTarget":
        vA = a.mostCommonTarget;
        vB = b.mostCommonTarget;
        break;
      case "bestHour":
        vA = a.bestHour;
        vB = b.bestHour;
        break;
      case "drawdown":
        vA = a.drawdown;
        vB = b.drawdown;
        break;
      default:
        vA = a.winRate;
        vB = b.winRate;
    }
    if (typeof vA === "string" && typeof vB === "string") {
      return sortOrder === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
    } else {
      return sortOrder === "asc" ? vA - vB : vB - vA;
    }
  });

  // Click handler for headers
  function handleSort(key) {
    if (sortKey === key) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  }

  // Helper for sort arrow
  function sortArrow(key) {
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <h2 className="text-xl font-bold">📒 Strategy Playbook</h2>
        <span
          className="text-muted-foreground text-sm"
          title="Top strategies by win rate and profit, with actionable stats"
        >
          ℹ️
        </span>
        <select
          className="border rounded px-2 py-1"
          value={filter.signal}
          onChange={(e) => setFilter((f) => ({ ...f, signal: e.target.value }))}
        >
          <option value="">All Signals</option>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>
        <input
          className="border rounded px-2 py-1"
          placeholder="Index (e.g. BTCUSDT)"
          value={filter.index}
          onChange={(e) => setFilter((f) => ({ ...f, index: e.target.value }))}
        />
        <input
          className="border rounded px-2 py-1"
          placeholder="Timeframe (e.g. 5min)"
          value={filter.timeframe}
          onChange={(e) =>
            setFilter((f) => ({ ...f, timeframe: e.target.value }))
          }
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr>
              <th
                className="px-2 py-1 border cursor-pointer"
                onClick={() => handleSort("key")}
              >
                Setup{sortArrow("key")}
              </th>
              <th
                className="px-2 py-1 border cursor-pointer"
                onClick={() => handleSort("winRate")}
              >
                Win Rate (%) {sortArrow("winRate")}
              </th>
              <th
                className="px-2 py-1 border cursor-pointer"
                onClick={() => handleSort("avgProfit")}
              >
                Avg Profit {sortArrow("avgProfit")}
              </th>
              <th
                className="px-2 py-1 border cursor-pointer"
                onClick={() => handleSort("count")}
              >
                Trades {sortArrow("count")}
              </th>
              <th
                className="px-2 py-1 border cursor-pointer"
                onClick={() => handleSort("mostCommonTarget")}
              >
                Most Common Target Hit {sortArrow("mostCommonTarget")}
              </th>
              <th
                className="px-2 py-1 border cursor-pointer"
                onClick={() => handleSort("bestHour")}
              >
                Best Hour {sortArrow("bestHour")}
              </th>
              <th
                className="px-2 py-1 border cursor-pointer"
                onClick={() => handleSort("drawdown")}
              >
                Max Drawdown {sortArrow("drawdown")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.key}>
                <td className="border px-2 py-1">{s.key}</td>
                <td className="border px-2 py-1">{s.winRate.toFixed(1)}</td>
                <td className="border px-2 py-1">₹{s.avgProfit.toFixed(0)}</td>
                <td className="border px-2 py-1">{s.count}</td>
                <td className="border px-2 py-1">{s.mostCommonTarget}</td>
                <td className="border px-2 py-1">{s.bestHour}</td>
                <td className="border px-2 py-1">₹{s.drawdown}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Click any column header to sort. Filter by signal, index, or timeframe
        to tailor your playbook. Use these stats to focus on the most accurate
        and profitable strategies!
      </div>
    </div>
  );
}

function AnalysisDashboard({ data, metrics }) {
  const [activeTab, setActiveTab] = useState("overview");

  const analysisData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Performance Analysis
    const profitableTrades = data.filter(
      (t) => parseFloat(t["Profit (INR)"] || 0) > 0
    );
    const lossTrades = data.filter(
      (t) => parseFloat(t["Profit (INR)"] || 0) <= 0
    );

    const totalProfit = profitableTrades.reduce(
      (sum, t) => sum + parseFloat(t["Profit (INR)"] || 0),
      0
    );
    const totalLoss = Math.abs(
      lossTrades.reduce((sum, t) => sum + parseFloat(t["Profit (INR)"] || 0), 0)
    );

    // Index Performance
    const indexPerformance = {};
    data.forEach((trade) => {
      const index = trade.Index;
      if (!indexPerformance[index]) {
        indexPerformance[index] = { trades: 0, profit: 0, wins: 0 };
      }
      indexPerformance[index].trades++;
      indexPerformance[index].profit += parseFloat(trade["Profit (INR)"] || 0);
      if (parseFloat(trade["Profit (INR)"] || 0) > 0) {
        indexPerformance[index].wins++;
      }
    });

    // Timeframe Analysis
    const timeframeAnalysis = {};
    data.forEach((trade) => {
      const tf = trade.Timeframe;
      if (!timeframeAnalysis[tf]) {
        timeframeAnalysis[tf] = {
          trades: 0,
          profit: 0,
          avgDuration: 0,
          durations: [],
        };
      }
      timeframeAnalysis[tf].trades++;
      timeframeAnalysis[tf].profit += parseFloat(trade["Profit (INR)"] || 0);
      if (trade["Trade Duration"]) {
        timeframeAnalysis[tf].durations.push(
          parseFloat(trade["Trade Duration"])
        );
      }
    });

    // Calculate average durations
    Object.keys(timeframeAnalysis).forEach((tf) => {
      const durations = timeframeAnalysis[tf].durations;
      timeframeAnalysis[tf].avgDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;
    });

    // Risk Metrics
    const profits = data.map((t) => parseFloat(t["Profit (INR)"] || 0));
    const maxProfit = Math.max(...profits);
    const maxLoss = Math.min(...profits);
    const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
    const profitStdDev = Math.sqrt(
      profits.reduce((sq, n) => sq + Math.pow(n - avgProfit, 2), 0) /
        profits.length
    );

    // Strategy Analysis
    const buyTrades = data.filter((t) => t.Signal === "Buy");
    const sellTrades = data.filter((t) => t.Signal === "Sell");

    const buyProfit = buyTrades.reduce(
      (sum, t) => sum + parseFloat(t["Profit (INR)"] || 0),
      0
    );
    const sellProfit = sellTrades.reduce(
      (sum, t) => sum + parseFloat(t["Profit (INR)"] || 0),
      0
    );

    return {
      totalTrades: data.length,
      profitableTrades: profitableTrades.length,
      lossTrades: lossTrades.length,
      winRate: (profitableTrades.length / data.length) * 100,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      profitFactor:
        totalLoss > 0
          ? totalProfit / totalLoss
          : totalProfit > 0
          ? Infinity
          : 0,
      indexPerformance,
      timeframeAnalysis,
      maxProfit,
      maxLoss,
      avgProfit,
      profitStdDev,
      buyTrades: buyTrades.length,
      sellTrades: sellTrades.length,
      buyProfit,
      sellProfit,
      buyWinRate:
        buyTrades.length > 0
          ? (buyTrades.filter((t) => parseFloat(t["Profit (INR)"] || 0) > 0)
              .length /
              buyTrades.length) *
            100
          : 0,
      sellWinRate:
        sellTrades.length > 0
          ? (sellTrades.filter((t) => parseFloat(t["Profit (INR)"] || 0) > 0)
              .length /
              sellTrades.length) *
            100
          : 0,
    };
  }, [data]);

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "-";
    return `${num.toFixed(2)}%`;
  };

  if (!analysisData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">
            No data available for analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <InsightsSection trades={data} />
      <StrategyPlaybook trades={data} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Portfolio Analysis Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {analysisData.totalTrades}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Trades
                  </div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {formatPercentage(analysisData.winRate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {formatCurrency(analysisData.netProfit)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Net Profit
                  </div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {analysisData.profitFactor.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Profit Factor
                  </div>
                </div>
              </div>

              {/* Profit/Loss Breakdown */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Profit Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Profit:</span>
                        <span className="text-green-500 font-semibold">
                          {formatCurrency(analysisData.totalProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Loss:</span>
                        <span className="text-red-500 font-semibold">
                          {formatCurrency(analysisData.totalLoss)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Net Profit:</span>
                        <span
                          className={`font-semibold ${
                            analysisData.netProfit >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {formatCurrency(analysisData.netProfit)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Trade Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Profitable Trades:</span>
                        <span className="text-green-500 font-semibold">
                          {analysisData.profitableTrades}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loss Trades:</span>
                        <span className="text-red-500 font-semibold">
                          {analysisData.lossTrades}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className="font-semibold">
                          {formatPercentage(analysisData.winRate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Index Performance */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Index Performance
                </h3>
                <div className="grid gap-4">
                  {Object.entries(analysisData.indexPerformance).map(
                    ([index, stats]) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{index}</span>
                          <Badge
                            variant={
                              stats.profit >= 0 ? "default" : "destructive"
                            }
                          >
                            {formatCurrency(stats.profit)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>Trades: {stats.trades}</div>
                          <div>Wins: {stats.wins}</div>
                          <div>
                            Win Rate:{" "}
                            {((stats.wins / stats.trades) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Timeframe Analysis */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Timeframe Analysis
                </h3>
                <div className="grid gap-4">
                  {Object.entries(analysisData.timeframeAnalysis).map(
                    ([tf, stats]) => (
                      <div key={tf} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{tf}</span>
                          <Badge
                            variant={
                              stats.profit >= 0 ? "default" : "destructive"
                            }
                          >
                            {formatCurrency(stats.profit)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>Trades: {stats.trades}</div>
                          <div>
                            Avg Duration: {stats.avgDuration.toFixed(1)}m
                          </div>
                          <div>
                            Avg Profit:{" "}
                            {formatCurrency(stats.profit / stats.trades)}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              {/* Risk Metrics */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-lg font-bold text-green-500">
                    {formatCurrency(analysisData.maxProfit)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Max Profit
                  </div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-lg font-bold text-red-500">
                    {formatCurrency(analysisData.maxLoss)}
                  </div>
                  <div className="text-sm text-muted-foreground">Max Loss</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-500">
                    {formatCurrency(analysisData.avgProfit)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Profit
                  </div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-lg font-bold text-purple-500">
                    {formatCurrency(analysisData.profitStdDev)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Std Deviation
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>Volatility: </span>
                      <Badge
                        variant={
                          analysisData.profitStdDev > 1000
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {analysisData.profitStdDev > 1000 ? "High" : "Low"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>Consistency: </span>
                      <Badge
                        variant={
                          analysisData.winRate > 60 ? "default" : "secondary"
                        }
                      >
                        {analysisData.winRate > 60
                          ? "Good"
                          : "Needs Improvement"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Profitability: </span>
                      <Badge
                        variant={
                          analysisData.netProfit > 0 ? "default" : "destructive"
                        }
                      >
                        {analysisData.netProfit > 0
                          ? "Profitable"
                          : "Loss Making"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategy" className="space-y-6">
              {/* Strategy Comparison */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Buy Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Trades:</span>
                        <span className="font-semibold">
                          {analysisData.buyTrades}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit:</span>
                        <span
                          className={`font-semibold ${
                            analysisData.buyProfit >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {formatCurrency(analysisData.buyProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className="font-semibold">
                          {formatPercentage(analysisData.buyWinRate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Sell Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Trades:</span>
                        <span className="font-semibold">
                          {analysisData.sellTrades}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit:</span>
                        <span
                          className={`font-semibold ${
                            analysisData.sellProfit >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {formatCurrency(analysisData.sellProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className="font-semibold">
                          {formatPercentage(analysisData.sellWinRate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strategy Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Strategy Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisData.buyWinRate > analysisData.sellWinRate ? (
                      <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-semibold text-green-700 dark:text-green-300">
                            Buy Strategy Performing Better
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            Consider focusing more on buy signals
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <div className="font-semibold text-blue-700 dark:text-blue-300">
                            Sell Strategy Performing Better
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            Consider focusing more on sell signals
                          </div>
                        </div>
                      </div>
                    )}

                    {analysisData.winRate < 50 && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <div>
                          <div className="font-semibold text-yellow-700 dark:text-yellow-300">
                            Low Win Rate Detected
                          </div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">
                            Review entry/exit criteria and risk management
                          </div>
                        </div>
                      </div>
                    )}

                    {analysisData.profitFactor < 1.5 && (
                      <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                        <div>
                          <div className="font-semibold text-orange-700 dark:text-orange-300">
                            Low Profit Factor
                          </div>
                          <div className="text-sm text-orange-600 dark:text-orange-400">
                            Consider improving risk-reward ratios
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalysisDashboard;

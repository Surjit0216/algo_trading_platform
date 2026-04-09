import React, { useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim().split(/\s/)[0];
  const parts = s.split(/[-\/]/);
  if (parts.length !== 3) return null;
  let day, month, year;
  if (parts[0].length === 4) { [year, month, day] = parts; }
  else { [day, month, year] = parts; }
  let y = Number(year);
  if (y < 100) y += 2000;
  const d = new Date(y, Number(month) - 1, Number(day));
  return isNaN(d.getTime()) ? null : d;
}

function fmt(num) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(num));
}

export default function InvestorSnapshot({ trades }) {
  const BASE = 1000000;

  const stats = useMemo(() => {
    if (!trades?.length) return null;
    const sorted = [...trades]
      .filter(t => parseDate(t["Signal Date"] || t["Date"]))
      .sort((a, b) => parseDate(a["Signal Date"] || a["Date"]) - parseDate(b["Signal Date"] || b["Date"]));
    if (!sorted.length) return null;

    let cum = 0;
    const equityCurve = sorted.map(t => {
      cum += parseFloat(t["Profit (INR)"] || 0);
      return parseFloat((BASE + cum).toFixed(2));
    });
    const labels = sorted.map(t => {
      const d = parseDate(t["Signal Date"] || t["Date"]);
      return d ? `${d.getDate()}/${d.getMonth() + 1}` : "";
    });

    const monthMap = {};
    sorted.forEach(t => {
      const d = parseDate(t["Signal Date"] || t["Date"]);
      if (!d) return;
      const mk = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!monthMap[mk]) monthMap[mk] = 0;
      monthMap[mk] += parseFloat(t["Profit (INR)"] || 0);
    });
    const months = Object.keys(monthMap);
    const monthlyProfits = months.map(m => parseFloat(monthMap[m].toFixed(2)));

    const totalProfit = cum;
    const currentValue = BASE + totalProfit;
    const totalROI = ((totalProfit / BASE) * 100).toFixed(1);

    const firstDate = parseDate(sorted[0]["Signal Date"] || sorted[0]["Date"]);
    const lastDate = parseDate(sorted[sorted.length - 1]["Signal Date"] || sorted[sorted.length - 1]["Date"]);
    const monthsElapsed = firstDate && lastDate
      ? Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30)))
      : 1;
    const firstDateStr = firstDate
      ? firstDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "-";

    const wins = sorted.filter(t => parseFloat(t["Profit (INR)"] || 0) > 0).length;
    const winRate = ((wins / sorted.length) * 100).toFixed(1);

    const bestProfit = Math.max(...monthlyProfits);
    const worstProfit = Math.min(...monthlyProfits);
    const bestMonth = months[monthlyProfits.indexOf(bestProfit)];
    const worstMonth = months[monthlyProfits.indexOf(worstProfit)];

    const activeTrades = trades.filter(t => t.Status === "In Progress" || !t.Status || t.Status === "Active");

    return {
      equityCurve, labels, months, monthlyProfits,
      totalProfit, currentValue, totalROI, monthsElapsed, firstDateStr,
      bestMonth, worstMonth, bestProfit, worstProfit, winRate, activeTrades,
      totalTrades: sorted.length,
    };
  }, [trades]);

  if (!stats) return <div className="p-8 text-center text-muted-foreground">No data</div>;

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { maxTicksLimit: 10, font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { font: { size: 10 }, callback: v => `₹${fmt(v)}` } },
    },
  };

  const equityData = {
    labels: stats.labels,
    datasets: [{
      label: "Portfolio Value",
      data: stats.equityCurve,
      borderColor: "#7c3aed",
      backgroundColor: "rgba(124,58,237,0.12)",
      borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 0,
    }],
  };

  const monthlyData = {
    labels: stats.months,
    datasets: [{
      data: stats.monthlyProfits,
      backgroundColor: stats.monthlyProfits.map(p => p >= 0 ? "rgba(16,185,129,0.8)" : "rgba(239,68,68,0.8)"),
      borderColor: stats.monthlyProfits.map(p => p >= 0 ? "#10b981" : "#ef4444"),
      borderWidth: 2, borderRadius: 6,
    }],
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-900 p-8 text-white shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
          If you invested ₹10,00,000 on {stats.firstDateStr}
        </p>
        <p className="mt-3 text-5xl font-black tracking-tight">₹{fmt(stats.currentValue)}</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <p className="text-2xl font-bold text-emerald-300">+{stats.totalROI}%</p>
            <p className="text-xs text-violet-300">Total ROI in {stats.monthsElapsed} months</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-300">+₹{fmt(stats.totalProfit)}</p>
            <p className="text-xs text-violet-300">Net Profit</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-sky-300">{stats.winRate}%</p>
            <p className="text-xs text-violet-300">Win Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-300">{stats.totalTrades}</p>
            <p className="text-xs text-violet-300">Total Trades</p>
          </div>
        </div>
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Current Value", value: `₹${fmt(stats.currentValue)}`, sub: "on ₹10L base capital", c: "from-violet-500 to-indigo-600" },
          { label: "Avg Monthly Profit", value: `+₹${fmt(stats.totalProfit / Math.max(stats.monthsElapsed, 1))}`, sub: "avg per month", c: "from-emerald-500 to-teal-600" },
          { label: "Best Month", value: `+₹${fmt(stats.bestProfit)}`, sub: stats.bestMonth, c: "from-sky-500 to-blue-600" },
          { label: "Worst Month", value: `${stats.worstProfit >= 0 ? "+" : "-"}₹${fmt(Math.abs(stats.worstProfit))}`, sub: stats.worstMonth, c: "from-rose-500 to-pink-600" },
        ].map(({ label, value, sub, c }) => (
          <div key={label} className={`rounded-xl bg-gradient-to-br ${c} p-4 text-white shadow-lg`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{label}</p>
            <p className="mt-1 text-xl font-extrabold">{value}</p>
            <p className="mt-0.5 text-xs text-white/60">{sub}</p>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Portfolio Growth — ₹10L Invested</CardTitle></CardHeader>
        <CardContent><div className="h-56"><Line data={equityData} options={chartOpts} /></div></CardContent>
      </Card>

      {/* Monthly P&L bars + heatmap tiles */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Month-on-Month Returns</CardTitle></CardHeader>
        <CardContent>
          <div className="h-44"><Bar data={monthlyData} options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ticks: { font: { size: 10 }, callback: v => `₹${fmt(v)}` } } } }} /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.months.map((m, i) => (
              <div key={m} className={`rounded-lg px-3 py-2 text-xs font-semibold border text-center min-w-[80px] ${stats.monthlyProfits[i] >= 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"}`}>
                <div className="font-bold text-[11px]">{m}</div>
                <div className="mt-0.5">{stats.monthlyProfits[i] >= 0 ? "+" : "-"}₹{fmt(Math.abs(stats.monthlyProfits[i]))}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Trades */}
      {stats.activeTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Active Positions ({stats.activeTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {stats.activeTrades.slice(0, 6).map((t, i) => (
                <div key={i} className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{t.Index}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.Signal === "Buy" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{t.Signal}</span>
                  </div>
                  <div className="mt-1 text-muted-foreground text-xs">Strike: {t.Strike}</div>
                  <div className="text-xs">Entry: ₹{parseFloat(t["Entry Premium"] || t["Entry Price"] || 0).toFixed(0)}</div>
                  <div className="text-xs">{t["Signal Date"] || t["Date"]}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

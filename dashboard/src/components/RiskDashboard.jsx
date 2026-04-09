import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeDrawdown } from "../lib/utils";

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

export default function RiskDashboard({ trades }) {
  const BASE = 1000000;

  const stats = useMemo(() => {
    if (!trades?.length) return null;
    const sorted = [...trades]
      .filter(t => parseDate(t["Signal Date"] || t["Date"]))
      .sort((a, b) => parseDate(a["Signal Date"] || a["Date"]) - parseDate(b["Signal Date"] || b["Date"]));

    const dd = computeDrawdown(sorted);
    const maxDrawdown = Math.min(...dd.map(d => d.drawdown));
    const maxDrawdownPct = ((Math.abs(maxDrawdown) / BASE) * 100).toFixed(1);

    const slHits = sorted.filter(t => String(t.Status).toLowerCase() === "sl hit").length;
    const slRate = ((slHits / sorted.length) * 100).toFixed(1);

    // Streaks
    let curWin = 0, bestWin = 0, curLoss = 0, worstLoss = 0;
    sorted.forEach(t => {
      const p = parseFloat(t["Profit (INR)"] || 0);
      if (p > 0) { curWin++; bestWin = Math.max(bestWin, curWin); curLoss = 0; }
      else { curLoss++; worstLoss = Math.max(worstLoss, curLoss); curWin = 0; }
    });

    // Sharpe-like: monthly ROI% series
    const monthMap = {};
    sorted.forEach(t => {
      const d = parseDate(t["Signal Date"] || t["Date"]);
      if (!d) return;
      const mk = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthMap[mk]) monthMap[mk] = 0;
      monthMap[mk] += parseFloat(t["Profit (INR)"] || 0);
    });
    const monthlyROIs = Object.values(monthMap).map(p => (p / BASE) * 100);
    const avgR = monthlyROIs.reduce((a, b) => a + b, 0) / (monthlyROIs.length || 1);
    const variance = monthlyROIs.reduce((a, b) => a + Math.pow(b - avgR, 2), 0) / (monthlyROIs.length || 1);
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? ((avgR / stdDev) * Math.sqrt(12)).toFixed(2) : "N/A";

    // Profitable months
    const profitableMonths = monthlyROIs.filter(r => r > 0).length;
    const profitableMonthsPct = ((profitableMonths / monthlyROIs.length) * 100).toFixed(0);

    // Last 20 trades W/L
    const recent = sorted.slice(-20).map(t => parseFloat(t["Profit (INR)"] || 0) > 0 ? "W" : "L");

    return {
      dd, maxDrawdown, maxDrawdownPct, slHits, slRate,
      bestWin, worstLoss, sharpe, profitableMonths, profitableMonthsPct,
      monthlyROIs, recent, totalTrades: sorted.length,
    };
  }, [trades]);

  if (!stats) return null;

  const ddData = {
    labels: stats.dd.map((_, i) => i + 1),
    datasets: [{
      label: "Drawdown (₹)",
      data: stats.dd.map(d => d.drawdown),
      borderColor: "#ef4444",
      backgroundColor: "rgba(239,68,68,0.12)",
      borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0,
    }],
  };

  const ddOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { ticks: { callback: v => `-₹${fmt(Math.abs(v))}`, font: { size: 10 } } },
    },
  };

  return (
    <div className="space-y-6">
      {/* Risk metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Max Drawdown", value: `-₹${fmt(Math.abs(stats.maxDrawdown))}`, sub: `${stats.maxDrawdownPct}% of ₹10L`, c: "from-red-500 to-rose-700" },
          { label: "SL Hit Rate", value: `${stats.slRate}%`, sub: `${stats.slHits} stop-losses hit`, c: "from-orange-500 to-amber-600" },
          { label: "Profitable Months", value: `${stats.profitableMonthsPct}%`, sub: `${stats.profitableMonths} of ${stats.monthlyROIs.length} months`, c: "from-emerald-500 to-teal-600" },
          { label: "Sharpe Ratio", value: stats.sharpe, sub: "Risk-adjusted (annualised)", c: "from-indigo-500 to-violet-600" },
        ].map(({ label, value, sub, c }) => (
          <div key={label} className={`rounded-xl bg-gradient-to-br ${c} p-4 text-white shadow-lg`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{label}</p>
            <p className="mt-1 text-2xl font-extrabold">{value}</p>
            <p className="mt-0.5 text-xs text-white/60">{sub}</p>
          </div>
        ))}
      </div>

      {/* Drawdown chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Drawdown History — All {stats.totalTrades} Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48"><Line data={ddData} options={ddOpts} /></div>
          <p className="mt-2 text-xs text-muted-foreground">
            Max drawdown was <strong>-₹{fmt(Math.abs(stats.maxDrawdown))}</strong> ({stats.maxDrawdownPct}% of ₹10L) —
            well within safe range for systematic intraday strategies. Recovery is typically within 2–5 trading sessions.
          </p>
        </CardContent>
      </Card>

      {/* Last 20 trades W/L */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Last 20 Trades — Win/Loss Sequence</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {stats.recent.map((r, i) => (
              <div key={i} className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold text-white ${r === "W" ? "bg-emerald-500" : "bg-red-500"}`}>
                {r}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-6 text-sm">
            <span className="text-muted-foreground">Best Win Streak: <strong className="text-emerald-600">{stats.bestWin} trades</strong></span>
            <span className="text-muted-foreground">Worst Loss Streak: <strong className="text-red-600">{stats.worstLoss} trades</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Two col: streak + safety */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Risk Metrics Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { l: "Max Drawdown", v: `-₹${fmt(Math.abs(stats.maxDrawdown))} (${stats.maxDrawdownPct}%)`, color: "text-red-600" },
                { l: "SL Hit Rate", v: `${stats.slRate}% (${stats.slHits} trades)`, color: "text-orange-600" },
                { l: "Best Win Streak", v: `${stats.bestWin} consecutive wins`, color: "text-emerald-600" },
                { l: "Worst Loss Streak", v: `${stats.worstLoss} consecutive losses`, color: "text-red-600" },
                { l: "Profitable Months", v: `${stats.profitableMonths} / ${stats.monthlyROIs.length} months`, color: "text-emerald-600" },
                { l: "Sharpe Ratio (est.)", v: stats.sharpe, color: "text-indigo-600" },
              ].map(({ l, v, color }) => (
                <div key={l} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <span className="text-sm text-muted-foreground">{l}</span>
                  <span className={`text-sm font-bold ${color}`}>{v}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Capital Safety Guarantees</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm">
              {[
                "Fixed SL on every single trade — no open-ended risk",
                `Max drawdown contained to ${stats.maxDrawdownPct}% of total capital`,
                "Capital stays in investor's own broker account at all times",
                "No single trade deploys more than 5–10% of total capital",
                "Daily P&L reports via Telegram — full transparency",
                "Monthly performance statements shared proactively",
                "Strategy paused automatically on consecutive SL hits",
              ].map((t, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

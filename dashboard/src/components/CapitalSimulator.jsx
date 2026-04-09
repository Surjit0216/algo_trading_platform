import React, { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
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

function getMonthKey(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
}

function fmt(num) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(num));
}

function simulate(ratePercent, capital, months, compound) {
  const rows = [];
  let cap = capital;
  let totalProfit = 0;
  for (let m = 1; m <= months; m++) {
    const profit = cap * (ratePercent / 100);
    totalProfit += profit;
    const ending = compound ? cap + profit : capital + totalProfit;
    rows.push({ month: m, start: Math.round(cap), profit: Math.round(profit), ending: Math.round(ending), totalProfit: Math.round(totalProfit) });
    if (compound) cap = ending;
  }
  return rows;
}

export default function CapitalSimulator({ trades }) {
  const [capital, setCapital] = useState(1000000);
  const [horizon, setHorizon] = useState(6);
  const [reinvest, setReinvest] = useState(false);

  const rates = useMemo(() => {
    const BASE = 1000000;
    const monthMap = {};
    trades.forEach(t => {
      const mk = getMonthKey(t["Signal Date"] || t["Date"]);
      if (!mk) return;
      if (!monthMap[mk]) monthMap[mk] = 0;
      monthMap[mk] += parseFloat(t["Profit (INR)"] || 0);
    });
    const roiPcts = Object.values(monthMap).map(p => (p / BASE) * 100);
    return {
      conservative: percentile(roiPcts, 25),
      realistic: percentile(roiPcts, 50),
      optimistic: percentile(roiPcts, 75),
      count: roiPcts.length,
      all: roiPcts,
    };
  }, [trades]);

  const conservative = simulate(rates.conservative, capital, horizon, reinvest);
  const realistic = simulate(rates.realistic, capital, horizon, reinvest);
  const optimistic = simulate(rates.optimistic, capital, horizon, reinvest);

  const labels = Array.from({ length: horizon }, (_, i) => `M${i + 1}`);

  const chartData = {
    labels,
    datasets: [
      { label: "Optimistic", data: optimistic.map(r => r.ending), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 2.5, fill: false, tension: 0.4, pointRadius: 3 },
      { label: "Realistic", data: realistic.map(r => r.ending), borderColor: "#6366f1", backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 3, fill: false, tension: 0.4, pointRadius: 3 },
      { label: "Conservative", data: conservative.map(r => r.ending), borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 2.5, fill: false, tension: 0.4, pointRadius: 3 },
    ],
  };

  const btnBase = "px-4 py-2 rounded-lg text-sm font-bold border-2 transition-colors";
  const btnActive = "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
  const btnInactive = "border-border bg-background";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Configure Your Investment</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Capital</p>
              <div className="flex gap-2">
                {[{ v: 500000, l: "₹5L" }, { v: 1000000, l: "₹10L" }, { v: 2000000, l: "₹20L" }].map(({ v, l }) => (
                  <button key={v} onClick={() => setCapital(v)} className={`${btnBase} ${capital === v ? btnActive : btnInactive}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Time Horizon</p>
              <div className="flex gap-2">
                {[1, 3, 6, 12].map(v => (
                  <button key={v} onClick={() => setHorizon(v)} className={`${btnBase} ${horizon === v ? btnActive : btnInactive}`}>{v}M</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Reinvest Profits</p>
              <button onClick={() => setReinvest(!reinvest)} className={`${btnBase} ${reinvest ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : btnInactive}`}>
                {reinvest ? "ON — Compound" : "OFF — Simple"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Conservative", rows: conservative, rate: rates.conservative, c: "from-amber-500 to-orange-600", sub: "25th percentile month" },
          { label: "Realistic", rows: realistic, rate: rates.realistic, c: "from-indigo-500 to-violet-600", sub: "Median month (most likely)" },
          { label: "Optimistic", rows: optimistic, rate: rates.optimistic, c: "from-emerald-500 to-teal-600", sub: "75th percentile month" },
        ].map(({ label, rows, rate, c, sub }) => {
          const last = rows[rows.length - 1];
          return (
            <div key={label} className={`rounded-xl bg-gradient-to-br ${c} p-5 text-white shadow-lg`}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">{label}</p>
              <p className="text-[10px] text-white/50 mb-2">{sub}</p>
              <p className="text-3xl font-black">₹{fmt(last.ending)}</p>
              <p className="mt-1 text-sm font-semibold text-white/80">Profit: +₹{fmt(last.totalProfit)}</p>
              <p className="mt-0.5 text-xs text-white/60">{rate.toFixed(1)}%/mo · {((last.totalProfit / capital) * 100).toFixed(1)}% total</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Capital Growth Projection</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <Line data={chartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
              scales: { y: { ticks: { callback: v => `₹${fmt(v)}`, font: { size: 10 } } }, x: { grid: { display: false } } },
            }} />
          </div>
        </CardContent>
      </Card>

      {/* Realistic month table */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Month-by-Month — Realistic Scenario</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-widest">
                  <th className="py-2 text-left">Month</th>
                  <th className="py-2 text-right">Starting</th>
                  <th className="py-2 text-right">Monthly Profit</th>
                  <th className="py-2 text-right">Ending Value</th>
                  <th className="py-2 text-right">Total Gain</th>
                  <th className="py-2 text-right">ROI%</th>
                </tr>
              </thead>
              <tbody>
                {realistic.map((row) => (
                  <tr key={row.month} className="border-b hover:bg-muted/40">
                    <td className="py-2 font-semibold">Month {row.month}</td>
                    <td className="py-2 text-right text-muted-foreground">₹{fmt(row.start)}</td>
                    <td className="py-2 text-right text-emerald-600 font-semibold">+₹{fmt(row.profit)}</td>
                    <td className="py-2 text-right font-bold">₹{fmt(row.ending)}</td>
                    <td className="py-2 text-right text-indigo-600 font-semibold">+₹{fmt(row.totalProfit)}</td>
                    <td className="py-2 text-right text-emerald-600 font-semibold">+{((row.totalProfit / capital) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Based on median of {rates.count} historical months of actual trades. Conservative = 25th pct month, Optimistic = 75th pct month.
            Past performance does not guarantee future results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

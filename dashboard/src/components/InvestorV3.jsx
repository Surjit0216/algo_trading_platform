import React, { useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ─── helpers ─────────────────────────────────────────────── */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim().split(/\s/)[0];
  const parts = s.split(/[-\/]/);
  if (parts.length !== 3) return null;
  let day, month, year;
  if (parts[0].length === 4) { [year, month, day] = parts; }
  else { [day, month, year] = parts; }
  let y = Number(year); if (y < 100) y += 2000;
  const d = new Date(y, Number(month) - 1, Number(day));
  return isNaN(d.getTime()) ? null : d;
}

function getMonthLabel(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)));
}

const TARGETS = [5, 10, 15, 20, 25, 30, 40, 50];

/* ─── main component ──────────────────────────────────────── */
export default function InvestorV3({ trades }) {
  const [selectedTarget, setSelectedTarget] = useState(20);
  const [filterIndex, setFilterIndex]       = useState("");
  const [filterSignal, setFilterSignal]     = useState("");
  const [filterMonth, setFilterMonth]       = useState("");
  const [filterPnl, setFilterPnl]           = useState("");  // "profit" | "loss" | ""

  /* ── 1. enrich each trade with premium ladder ── */
  const enriched = useMemo(() => {
    return trades
      .map(t => {
        const entry    = parseFloat(t["Entry Premium"]       || 0);
        const final    = parseFloat(t["Final Target Premium"] || 0);
        const qty      = parseFloat(t["Volume"]              || 1);
        const movement = final - entry;
        const date     = t["Signal Date"] || t["Date"] || "";
        const month    = getMonthLabel(date);

        const ladder = {};
        TARGETS.forEach(T => {
          ladder[T] = { hit: movement >= T };
        });

        return { ...t, _entry: entry, _final: final, _qty: qty, _movement: movement, _ladder: ladder, _month: month };
      })
      .filter(t => t._entry > 0 && t._final > 0); // only trades with valid premium data
  }, [trades]);

  /* ── 2. derived options for filters ── */
  const { indexes, months } = useMemo(() => ({
    indexes: [...new Set(enriched.map(t => t.Index).filter(Boolean))].sort(),
    months:  [...new Set(enriched.map(t => t._month).filter(Boolean))].sort((a, b) => new Date(b) - new Date(a)),
  }), [enriched]);

  /* ── 3. hit funnel (all trades, no filter) ── */
  const funnel = useMemo(() => {
    const total = enriched.length;
    return TARGETS.map(T => {
      const hits = enriched.filter(t => t._ladder[T].hit).length;
      return { T, hits, rate: total ? ((hits / total) * 100).toFixed(1) : "0.0" };
    });
  }, [enriched]);

  /* ── 4. apply filters ── */
  const filtered = useMemo(() => {
    let data = enriched;
    if (filterIndex)  data = data.filter(t => t.Index  === filterIndex);
    if (filterSignal) data = data.filter(t => t.Signal === filterSignal);
    if (filterMonth)  data = data.filter(t => t._month === filterMonth);
    return data;
  }, [enriched, filterIndex, filterSignal, filterMonth]);

  /* ── 5. compute per-trade P&L for selected target, then apply pnl filter ── */
  const computed = useMemo(() => {
    return filtered.map(t => {
      const hit    = t._ladder[selectedTarget].hit;
      const profit = hit
        ? selectedTarget * t._qty
        : t._movement * t._qty;
      const roi = t._entry > 0 ? ((hit ? selectedTarget : t._movement) / t._entry * 100) : 0;
      return { ...t, _hit: hit, _profit: profit, _roi: roi };
    });
  }, [filtered, selectedTarget]);

  const computedFiltered = useMemo(() => {
    if (!filterPnl) return computed;
    if (filterPnl === "profit") return computed.filter(t => t._profit > 0);
    return computed.filter(t => t._profit <= 0);
  }, [computed, filterPnl]);

  /* ── 6. summary metrics ── */
  const metrics = useMemo(() => {
    const data  = computed;
    const total = data.length;
    if (!total) return null;

    const wins  = data.filter(t => t._hit).length;
    const totalP = data.filter(t => t._profit > 0).reduce((s, t) => s + t._profit, 0);
    const totalL = data.filter(t => t._profit < 0).reduce((s, t) => s + t._profit, 0);
    const netPnl = data.reduce((s, t) => s + t._profit, 0);
    const avgRoi = data.reduce((s, t) => s + t._roi, 0) / total;
    const pf = totalL !== 0 ? (totalP / Math.abs(totalL)).toFixed(2) : totalP > 0 ? "∞" : "0.00";

    return { total, wins, winRate: ((wins / total) * 100).toFixed(1), totalP, totalL, netPnl, avgRoi: avgRoi.toFixed(1), pf };
  }, [computed]);

  /* ── 7. monthly breakdown for selected target ── */
  const monthly = useMemo(() => {
    const mMap = {};
    computed.forEach(t => {
      const mk = t._month; if (!mk) return;
      if (!mMap[mk]) mMap[mk] = { profit: 0, trades: 0, hits: 0 };
      mMap[mk].profit += t._profit;
      mMap[mk].trades += 1;
      if (t._hit) mMap[mk].hits += 1;
    });
    return Object.entries(mMap)
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => new Date(b.label) - new Date(a.label));
  }, [computed]);

  const momChart = useMemo(() => ({
    labels: [...monthly].reverse().map(m => m.label.replace(" 20", " '")),
    datasets: [{
      label: `Monthly P&L at ₹${selectedTarget} exit`,
      data: [...monthly].reverse().map(m => Math.round(m.profit)),
      backgroundColor: [...monthly].reverse().map(m => m.profit >= 0 ? "rgba(16,185,129,0.75)" : "rgba(239,68,68,0.75)"),
      borderColor: [...monthly].reverse().map(m => m.profit >= 0 ? "#10b981" : "#ef4444"),
      borderWidth: 2, borderRadius: 6,
    }],
  }), [monthly, selectedTarget]);

  /* ─── render ──────────────────────────────────────────────── */
  if (!enriched.length) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
      No trades with valid Entry Premium + Final Target Premium data found.
    </div>
  );

  const funnelSelected = funnel.find(f => f.T === selectedTarget);

  return (
    <div className="space-y-6">

      {/* ── HIT FUNNEL ── */}
      <div>
        <h2 className="text-base font-bold mb-3">
          Premium Exit Hit Funnel
          <span className="ml-2 text-xs font-normal text-muted-foreground">({enriched.length} trades with premium data)</span>
        </h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {funnel.map(({ T, hits, rate }) => {
            const isSelected = T === selectedTarget;
            return (
              <button
                key={T}
                onClick={() => setSelectedTarget(T)}
                className={`rounded-xl p-3 text-center border-2 transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-border bg-card hover:border-indigo-300"
                }`}
              >
                <p className={`text-xs font-bold uppercase tracking-widest ${isSelected ? "text-indigo-600 dark:text-indigo-300" : "text-muted-foreground"}`}>
                  ₹{T}
                </p>
                <p className={`text-2xl font-black mt-1 ${isSelected ? "text-indigo-700 dark:text-indigo-200" : ""}`}>
                  {rate}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{hits} hits</p>
                {/* progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isSelected ? "bg-indigo-500" : "bg-emerald-400"}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── INSIGHT LINE ── */}
      {metrics && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 p-4 text-white">
          <p className="text-sm font-semibold">
            If you exited every trade at <strong>₹{selectedTarget} premium gain</strong> consistently —
            your total profit would be <strong>₹{fmt(metrics.netPnl)}</strong> with a <strong>{metrics.winRate}% win rate</strong>
            {funnelSelected && <> and <strong>{funnelSelected.rate}%</strong> of trades would have hit this target</>}.
          </p>
        </div>
      )}

      {/* ── FILTERS ── */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Exit target */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Exit Target</p>
              <select
                value={selectedTarget}
                onChange={e => setSelectedTarget(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 text-sm font-semibold"
              >
                {TARGETS.map(T => <option key={T} value={T}>₹{T} exit</option>)}
              </select>
            </div>
            {/* Index */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Index</p>
              <select value={filterIndex} onChange={e => setFilterIndex(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">All Indexes</option>
                {indexes.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            {/* Signal */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Signal</p>
              <select value={filterSignal} onChange={e => setFilterSignal(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">All Signals</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>
            {/* Month */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Month</p>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">All Months</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {/* P&L */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">P&L</p>
              <select value={filterPnl} onChange={e => setFilterPnl(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="profit">Profit only</option>
                <option value="loss">Loss only</option>
              </select>
            </div>
            {/* Reset */}
            {(filterIndex || filterSignal || filterMonth || filterPnl) && (
              <button
                onClick={() => { setFilterIndex(""); setFilterSignal(""); setFilterMonth(""); setFilterPnl(""); }}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── SUMMARY CARDS ── */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Trades",   value: metrics.total,              sub: `${metrics.wins} hit ₹${selectedTarget}`,      c: "from-violet-500 to-indigo-600" },
            { label: "Win Rate",       value: `${metrics.winRate}%`,      sub: "trades hitting target",                        c: "from-emerald-500 to-teal-600" },
            { label: "Net P&L",        value: `${metrics.netPnl >= 0 ? "+" : "-"}₹${fmt(metrics.netPnl)}`, sub: "at ₹" + selectedTarget + " exit", c: metrics.netPnl >= 0 ? "from-emerald-600 to-green-700" : "from-red-500 to-rose-600" },
            { label: "Total Profit",   value: `+₹${fmt(metrics.totalP)}`, sub: "from winning trades",                          c: "from-sky-500 to-blue-600" },
            { label: "Avg ROI",        value: `${metrics.avgRoi}%`,       sub: "per trade",                                    c: "from-orange-500 to-amber-600" },
            { label: "Profit Factor",  value: metrics.pf,                 sub: "gross profit / gross loss",                    c: "from-slate-600 to-slate-800" },
          ].map(({ label, value, sub, c }) => (
            <div key={label} className={`rounded-xl bg-gradient-to-br ${c} p-4 text-white shadow`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{label}</p>
              <p className="text-xl font-extrabold mt-1 leading-tight">{value}</p>
              <p className="text-[10px] text-white/50 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── MONTHLY BAR CHART ── */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Monthly P&L — ₹{selectedTarget} Exit Strategy
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Best: +₹{fmt(Math.max(...monthly.map(m => m.profit)))} · Worst: {Math.min(...monthly.map(m => m.profit)) < 0 ? "-" : "+"}₹{fmt(Math.abs(Math.min(...monthly.map(m => m.profit))))}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <Bar data={momChart} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                  y: { ticks: { callback: v => `₹${fmt(v)}`, font: { size: 10 } } },
                },
              }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── MONTHLY TABLE ── */}
      {monthly.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Month-wise Breakdown — ₹{selectedTarget} Exit</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="py-2 text-left">Month</th>
                    <th className="py-2 text-right">Trades</th>
                    <th className="py-2 text-right">Hits (₹{selectedTarget})</th>
                    <th className="py-2 text-right">Hit Rate</th>
                    <th className="py-2 text-right">Net P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map(m => (
                    <tr key={m.label} className="border-b hover:bg-muted/40">
                      <td className="py-2 font-semibold">{m.label}</td>
                      <td className="py-2 text-right text-muted-foreground">{m.trades}</td>
                      <td className="py-2 text-right">{m.hits}</td>
                      <td className="py-2 text-right">{((m.hits / m.trades) * 100).toFixed(0)}%</td>
                      <td className={`py-2 text-right font-bold ${m.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {m.profit >= 0 ? "+" : "-"}₹{fmt(Math.abs(m.profit))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TRADE TABLE ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Trade Log — ₹{selectedTarget} Exit
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {computedFiltered.length} trades shown
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 text-left">Signal Date</th>
                  <th className="py-2 text-left">Signal</th>
                  <th className="py-2 text-left">Index</th>
                  <th className="py-2 text-right">Entry Premium</th>
                  <th className="py-2 text-right">Final Premium</th>
                  <th className="py-2 text-right">Move (₹)</th>
                  <th className="py-2 text-center">₹{selectedTarget} Status</th>
                  <th className="py-2 text-right">Simulated P&L</th>
                  <th className="py-2 text-right">ROI%</th>
                </tr>
              </thead>
              <tbody>
                {computedFiltered.map((t, i) => (
                  <tr key={i} className={`border-b hover:bg-muted/40 ${t._hit ? "" : "opacity-70"}`}>
                    <td className="py-1.5 text-xs">{t["Signal Date"] || t["Date"] || "-"}</td>
                    <td className="py-1.5">
                      <Badge variant={t.Signal === "Buy" ? "secondary" : "destructive"} className="text-xs">
                        {t.Signal || "-"}
                      </Badge>
                    </td>
                    <td className="py-1.5 text-xs">{t.Index || "-"}</td>
                    <td className="py-1.5 text-right font-mono text-xs">₹{t._entry.toFixed(2)}</td>
                    <td className="py-1.5 text-right font-mono text-xs">₹{t._final.toFixed(2)}</td>
                    <td className={`py-1.5 text-right font-mono text-xs font-semibold ${t._movement >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {t._movement >= 0 ? "+" : ""}{t._movement.toFixed(2)}
                    </td>
                    <td className="py-1.5 text-center">
                      {t._hit ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 text-xs font-semibold">
                          ✓ Hit ₹{selectedTarget}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 text-xs font-semibold">
                          ✗ Not Hit
                        </span>
                      )}
                    </td>
                    <td className={`py-1.5 text-right font-semibold text-xs ${t._profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {t._profit >= 0 ? "+" : "-"}₹{fmt(Math.abs(t._profit))}
                    </td>
                    <td className={`py-1.5 text-right text-xs ${t._roi >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {t._roi >= 0 ? "+" : ""}{t._roi.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

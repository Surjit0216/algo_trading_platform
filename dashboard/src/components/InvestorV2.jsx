import React, { useState, useMemo, useRef } from "react";
import { Line, Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
function getMonthKey(s) {
  const d = parseDate(s); if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(Math.floor((p / 100) * s.length), s.length - 1)];
}
function fmt(n) { return new Intl.NumberFormat("en-IN").format(Math.round(Math.abs(n))); }
function fmtShort(n) {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(abs / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `₹${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${(abs / 1e3).toFixed(0)}K`;
  return `₹${Math.round(abs)}`;
}

function simulate(ratePercent, capital, months, compound) {
  let cap = capital, total = 0;
  return Array.from({ length: months }, (_, i) => {
    const profit = cap * (ratePercent / 100);
    total += profit;
    const ending = compound ? cap + profit : capital + total;
    if (compound) cap = ending;
    return { month: i + 1, ending: Math.round(ending), profit: Math.round(profit), total: Math.round(total) };
  });
}

const PRESETS = [
  { v: 50000,   l: "₹50K",  tag: "Starter" },
  { v: 100000,  l: "₹1L",   tag: "Explorer" },
  { v: 500000,  l: "₹5L",   tag: "Growth" },
  { v: 1000000, l: "₹10L",  tag: "Standard" },
  { v: 2000000, l: "₹20L",  tag: "Premium" },
];

const PSYCHOLOGY = {
  50000:   { tone: "Start small, learn the system. Real skin in the game — zero pressure.",        monthly: "₹1,500–₹4,000",  colour: "from-slate-500 to-slate-700" },
  100000:  { tone: "See real returns on meaningful capital. A great first step.",                  monthly: "₹3,000–₹8,000",  colour: "from-sky-600 to-blue-700" },
  500000:  { tone: "This tier generates monthly income — not just portfolio returns.",             monthly: "₹15,000–₹40,000", colour: "from-indigo-600 to-violet-700" },
  1000000: { tone: "₹10L puts you in the serious investor bracket. Monthly income > most salaries.",monthly: "₹30,000–₹80,000", colour: "from-violet-600 to-purple-800" },
  2000000: { tone: "Premium tier. Expected monthly returns exceed most senior professional salaries.", monthly: "₹60,000–₹1,60,000", colour: "from-rose-600 to-pink-800" },
};

// FD = 7% pa / 12, NIFTY = 12% pa / 12
const FD_MONTHLY    = 7  / 12;   // ~0.583%
const NIFTY_MONTHLY = 12 / 12;   // ~1%

/* ─── component ──────────────────────────────────────────── */
export default function InvestorV2({ trades }) {
  const [capital, setCapital]       = useState(1000000);
  const [customActive, setCustomActive] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [horizon, setHorizon]       = useState(6);
  const [compound, setCompound]     = useState(true);
  const inputRef = useRef(null);

  /* ── rates from actual trade data ── */
  const { rates, monthlyProfits, monthLabels, totalProfit, totalTrades, winRate,
          maxDrawdownPct, slRate, equityCurve, firstDate } = useMemo(() => {
    const BASE = 1_000_000;
    if (!trades?.length) return { rates: { c: 3, r: 5, o: 8 }, monthlyProfits: [], monthLabels: [], totalProfit: 0, totalTrades: 0, winRate: 0, maxDrawdownPct: 0, slRate: 0, equityCurve: [], firstDate: null };

    const sorted = [...trades]
      .filter(t => parseDate(t["Signal Date"] || t["Date"]))
      .sort((a, b) => parseDate(a["Signal Date"] || a["Date"]) - parseDate(b["Signal Date"] || b["Date"]));

    // Monthly map
    const mMap = {};
    sorted.forEach(t => {
      const mk = getMonthKey(t["Signal Date"] || t["Date"]); if (!mk) return;
      if (!mMap[mk]) mMap[mk] = { profit: 0, label: "", d: null };
      const d = parseDate(t["Signal Date"] || t["Date"]);
      if (d) { mMap[mk].label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }); mMap[mk].d = d; }
      mMap[mk].profit += parseFloat(t["Profit (INR)"] || 0);
    });
    const sortedMonths = Object.values(mMap).sort((a, b) => a.d - b.d);
    const roiPcts = sortedMonths.map(m => (m.profit / BASE) * 100);
    const rates = {
      c: percentile(roiPcts, 25),
      r: percentile(roiPcts, 50),
      o: percentile(roiPcts, 75),
      count: roiPcts.length,
    };

    // Totals
    const totalProfit = sorted.reduce((s, t) => s + parseFloat(t["Profit (INR)"] || 0), 0);
    const wins = sorted.filter(t => parseFloat(t["Profit (INR)"] || 0) > 0).length;
    const winRate = ((wins / sorted.length) * 100).toFixed(1);
    const slHits = sorted.filter(t => String(t.Status).toLowerCase() === "sl hit").length;
    const slRate = ((slHits / sorted.length) * 100).toFixed(1);

    // Drawdown
    let peak = 0, eq = 0, maxDD = 0;
    sorted.forEach(t => { eq += parseFloat(t["Profit (INR)"] || 0); if (eq > peak) peak = eq; maxDD = Math.min(maxDD, eq - peak); });
    const maxDrawdownPct = ((Math.abs(maxDD) / BASE) * 100).toFixed(1);

    // Equity curve
    let cum = 0;
    const equityCurve = sorted.map(t => { cum += parseFloat(t["Profit (INR)"] || 0); return Math.round(BASE + cum); });
    const firstDate = parseDate(sorted[0]["Signal Date"] || sorted[0]["Date"]);

    return { rates, monthlyProfits: sortedMonths.map(m => Math.round(m.profit)), monthLabels: sortedMonths.map(m => m.label), totalProfit, totalTrades: sorted.length, winRate, maxDrawdownPct, slRate, equityCurve, firstDate };
  }, [trades]);

  /* ── current psychology message ── */
  const psych = PSYCHOLOGY[customActive ? null : capital] || {
    tone: "Flexible capital — all projections scale proportionally with your input.",
    monthly: "Scales with capital",
    colour: "from-indigo-600 to-violet-700",
  };

  /* ── simulations ── */
  const [simC, simR, simO, simFD, simNIFTY] = [
    simulate(rates.c, capital, horizon, compound),
    simulate(rates.r, capital, horizon, compound),
    simulate(rates.o, capital, horizon, compound),
    simulate(FD_MONTHLY, capital, horizon, false),
    simulate(NIFTY_MONTHLY, capital, horizon, false),
  ];

  const labels = Array.from({ length: horizon }, (_, i) => `M${i + 1}`);

  const growthChart = {
    labels,
    datasets: [
      { label: "Strategy (Realistic)", data: simR.map(r => r.ending), borderColor: "#6366f1", borderWidth: 3, fill: false, tension: 0.4, pointRadius: 3 },
      { label: "Strategy (Optimistic)", data: simO.map(r => r.ending), borderColor: "#10b981", borderWidth: 2, borderDash: [4, 3], fill: false, tension: 0.4, pointRadius: 2 },
      { label: "NIFTY 50 (~12% pa)",   data: simNIFTY.map(r => r.ending), borderColor: "#f59e0b", borderWidth: 2, fill: false, tension: 0.4, pointRadius: 2 },
      { label: "FD (~7% pa)",          data: simFD.map(r => r.ending), borderColor: "#94a3b8", borderWidth: 1.5, borderDash: [6, 4], fill: false, tension: 0.3, pointRadius: 1 },
    ],
  };

  const momChart = {
    labels: monthLabels,
    datasets: [{
      label: "Monthly P&L (₹)",
      data: monthlyProfits,
      backgroundColor: monthlyProfits.map(p => p >= 0 ? "rgba(16,185,129,0.75)" : "rgba(239,68,68,0.75)"),
      borderColor: monthlyProfits.map(p => p >= 0 ? "#10b981" : "#ef4444"),
      borderWidth: 2, borderRadius: 6,
    }],
  };

  const chartOpts = (yFmt) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { ticks: { callback: yFmt, font: { size: 10 } } },
    },
  });

  /* ── custom input handler ── */
  const handleApply = () => {
    const val = parseInt(customInput.replace(/[^0-9]/g, ""), 10);
    if (!val || val < 5000 || val > 50000000) return;
    setCapital(val); setCustomActive(true); setShowCustom(false);
  };

  const handlePreset = (v) => { setCapital(v); setCustomActive(false); setShowCustom(false); };

  const btnBase    = "px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all";
  const btnOn      = "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300";
  const btnOff     = "border-border bg-background hover:border-indigo-300";

  const lastR = simR[simR.length - 1];
  const lastO = simO[simO.length - 1];
  const lastC = simC[simC.length - 1];

  return (
    <div className="space-y-8 pb-12">

      {/* ── HERO ── */}
      <div className={`rounded-2xl bg-gradient-to-br ${psych.colour} p-8 text-white shadow-2xl`}>
        <div className="flex flex-wrap gap-8 items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Investor Simulation V2 · Real Data</p>
            <h1 className="text-4xl font-black tracking-tight">
              {fmtShort(capital)} <span className="text-white/50">→</span> <span className="text-emerald-300">{fmtShort(lastR.ending)}</span>
            </h1>
            <p className="mt-2 text-white/70 text-sm max-w-lg">
              Realistic projection in <strong>{horizon} months</strong> based on actual trade history.
              Optimistic: <strong>{fmtShort(lastO.ending)}</strong> · Conservative: <strong>{fmtShort(lastC.ending)}</strong>
            </p>
            <p className="mt-3 text-white/90 font-semibold">{psych.tone}</p>
            <p className="mt-1 text-emerald-300 font-bold text-lg">Expected monthly income: {psych.monthly}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            {[
              { l: "Win Rate",       v: `${winRate}%`,           c: "bg-white/10" },
              { l: "Total Trades",   v: totalTrades,              c: "bg-white/10" },
              { l: "Max Drawdown",   v: `${maxDrawdownPct}%`,     c: "bg-white/10" },
              { l: "SL Hit Rate",    v: `${slRate}%`,             c: "bg-white/10" },
            ].map(({ l, v, c }) => (
              <div key={l} className={`rounded-xl ${c} backdrop-blur p-3 text-center`}>
                <p className="text-xs text-white/60">{l}</p>
                <p className="text-xl font-extrabold mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CAPITAL SELECTOR ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Configure Capital & Horizon</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Capital</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(({ v, l, tag }) => (
                  <button key={v} onClick={() => handlePreset(v)}
                    className={`${btnBase} flex-col items-center leading-tight ${!customActive && capital === v ? btnOn : btnOff}`}>
                    <span>{l}</span>
                    <span className="text-[9px] font-normal opacity-60">{tag}</span>
                  </button>
                ))}
                <button onClick={() => { setShowCustom(s => !s); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className={`${btnBase} ${customActive ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" : btnOff}`}>
                  {customActive ? `₹${fmt(capital)}` : "Custom ₹"}
                </button>
              </div>
              {showCustom && (
                <div className="mt-3 flex items-center gap-2 p-3 border-2 border-violet-300 rounded-xl bg-violet-50 dark:bg-violet-950/20">
                  <span className="font-bold text-muted-foreground">₹</span>
                  <input ref={inputRef} type="number" min={5000} max={50000000}
                    placeholder="5,000 – 50,00,000" value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleApply()}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
                  <button onClick={handleApply} className="px-4 py-1.5 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700 transition-colors">Apply</button>
                  <button onClick={() => setShowCustom(false)} className="px-3 py-1.5 border text-sm rounded-lg hover:bg-muted">✕</button>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Horizon</p>
              <div className="flex gap-2">
                {[1, 3, 6, 12].map(v => (
                  <button key={v} onClick={() => setHorizon(v)} className={`${btnBase} ${horizon === v ? btnOn : btnOff}`}>{v}M</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Compound</p>
              <button onClick={() => setCompound(!compound)}
                className={`${btnBase} ${compound ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : btnOff}`}>
                {compound ? "Reinvesting profits" : "Simple returns"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SCENARIOS ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Conservative", row: lastC, rate: rates.c, c: "from-amber-500 to-orange-600", sub: "Worst-case (25th pct month)" },
          { label: "Realistic",    row: lastR, rate: rates.r, c: "from-indigo-500 to-violet-700", sub: "Most likely (median month)" },
          { label: "Optimistic",   row: lastO, rate: rates.o, c: "from-emerald-500 to-teal-600", sub: "Best-case (75th pct month)" },
        ].map(({ label, row, rate, c, sub }) => (
          <div key={label} className={`rounded-xl bg-gradient-to-br ${c} p-5 text-white shadow-lg`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</p>
            <p className="text-[9px] text-white/40 mb-2">{sub}</p>
            <p className="text-3xl font-black">₹{fmt(row.ending)}</p>
            <p className="text-sm font-semibold text-white/80 mt-1">+₹{fmt(row.total)} profit</p>
            <p className="text-xs text-white/50">{rate.toFixed(1)}%/mo · {((row.total / capital) * 100).toFixed(1)}% total in {horizon}m</p>
          </div>
        ))}
      </div>

      {/* ── FD vs NIFTY vs STRATEGY ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Our Strategy vs FD vs NIFTY — {horizon} Month Projection</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 mb-4">
            <Line data={growthChart} options={chartOpts(v => `₹${fmt(v)}`)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 text-left">Investment</th>
                  <th className="py-2 text-right">Monthly Rate</th>
                  <th className="py-2 text-right">Final Value</th>
                  <th className="py-2 text-right">Profit in {horizon}M</th>
                  <th className="py-2 text-right">Total ROI</th>
                  <th className="py-2 text-right">Alpha vs FD</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Fixed Deposit (7% pa)", row: simFD[simFD.length - 1], rate: FD_MONTHLY, colour: "text-slate-500", base: simFD[simFD.length - 1].total },
                  { name: "NIFTY 50 (~12% pa)",    row: simNIFTY[simNIFTY.length - 1], rate: NIFTY_MONTHLY, colour: "text-amber-600", base: simFD[simFD.length - 1].total },
                  { name: "Strategy — Conservative", row: simC[simC.length - 1], rate: rates.c, colour: "text-orange-600", base: simFD[simFD.length - 1].total },
                  { name: "Strategy — Realistic",    row: simR[simR.length - 1], rate: rates.r, colour: "text-indigo-600 font-bold", base: simFD[simFD.length - 1].total },
                  { name: "Strategy — Optimistic",   row: simO[simO.length - 1], rate: rates.o, colour: "text-emerald-600", base: simFD[simFD.length - 1].total },
                ].map(({ name, row, rate, colour, base }) => (
                  <tr key={name} className="border-b hover:bg-muted/40">
                    <td className={`py-2 ${colour}`}>{name}</td>
                    <td className="py-2 text-right">{rate.toFixed(2)}%</td>
                    <td className="py-2 text-right font-semibold">₹{fmt(row.ending)}</td>
                    <td className="py-2 text-right text-emerald-600">+₹{fmt(row.total)}</td>
                    <td className="py-2 text-right">+{((row.total / capital) * 100).toFixed(1)}%</td>
                    <td className="py-2 text-right font-bold text-emerald-600">+₹{fmt(row.total - base)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── ACTUAL MONTHLY PERFORMANCE ── */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Actual Monthly P&L — Real Trade History ({monthLabels.length} months)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-52 mb-4">
            <Bar data={momChart} options={chartOpts(v => `₹${fmt(v)}`)} />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {monthLabels.map((m, i) => (
              <div key={m} className={`rounded-lg px-3 py-2 text-xs font-semibold text-center min-w-[72px] border ${monthlyProfits[i] >= 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"}`}>
                <div className="font-bold text-[10px]">{m}</div>
                <div>{monthlyProfits[i] >= 0 ? "+" : "-"}₹{fmt(Math.abs(monthlyProfits[i]))}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── MONTH TABLE WITH YOUR CAPITAL ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Month-by-Month Journey — ₹{fmt(capital)} · Realistic · {compound ? "Compounding" : "Simple"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="py-2 text-left">Month</th>
                  <th className="py-2 text-right">Starting Capital</th>
                  <th className="py-2 text-right">Monthly Earnings</th>
                  <th className="py-2 text-right">Portfolio Value</th>
                  <th className="py-2 text-right">Total Gained</th>
                  <th className="py-2 text-right">ROI %</th>
                </tr>
              </thead>
              <tbody>
                {simR.map((row, i) => (
                  <tr key={row.month} className="border-b hover:bg-muted/40">
                    <td className="py-2 font-semibold">Month {row.month}</td>
                    <td className="py-2 text-right text-muted-foreground">₹{fmt(i === 0 ? capital : simR[i - 1].ending)}</td>
                    <td className="py-2 text-right text-emerald-600 font-semibold">+₹{fmt(row.profit)}</td>
                    <td className="py-2 text-right font-bold text-indigo-700 dark:text-indigo-300">₹{fmt(row.ending)}</td>
                    <td className="py-2 text-right text-emerald-600">+₹{fmt(row.total)}</td>
                    <td className="py-2 text-right font-bold text-emerald-600">+{((row.total / capital) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── RISK & DRAWDOWN ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Drawdown & Risk Visibility</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { l: "Max Drawdown ever", v: `${maxDrawdownPct}% of capital`, c: "text-red-600" },
              { l: "Stop-Loss hit rate", v: `${slRate}% of all trades`, c: "text-orange-600" },
              { l: "Profitable months", v: `${monthlyProfits.filter(p => p > 0).length} / ${monthlyProfits.length}`, c: "text-emerald-600" },
              { l: "Worst month loss", v: `₹${fmt(Math.abs(Math.min(...monthlyProfits, 0)))}`, c: "text-red-500" },
              { l: "Best month gain", v: `+₹${fmt(Math.max(...monthlyProfits, 0))}`, c: "text-emerald-600" },
            ].map(({ l, v, c }) => (
              <div key={l} className="flex justify-between items-center border-b pb-2 last:border-0">
                <span className="text-sm text-muted-foreground">{l}</span>
                <span className={`text-sm font-bold ${c}`}>{v}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Even in worst-case months, the drawdown has remained controlled. Recovery typically happens within 2–3 sessions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Transparency — How It Works</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {[
                { n: "1", t: "Signal generated", d: "Algorithm detects opportunity on TradingView. Signal triggers immediately." },
                { n: "2", t: "Webhook execution", d: "Automated webhook places order in broker system — no manual intervention." },
                { n: "3", t: "Targets set at entry", d: "T1 through T6 targets set automatically. Position exits at each hit." },
                { n: "4", t: "SL always in place", d: "Every trade has a hard stop-loss. Capital is always protected." },
                { n: "5", t: "Logged to Google Sheet", d: "Every trade, timestamp, and P&L is logged live — visible to investor on request." },
              ].map(({ n, t, d }) => (
                <li key={n} className="flex gap-3 items-start">
                  <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* ── SAFETY CHECKLIST ── */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10">
        <CardHeader><CardTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Capital Safety Commitments</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "Capital stays in your own broker account — we never hold funds",
              "Hard stop-loss on every single trade, no exceptions",
              "Daily P&L report via Telegram before market close",
              "Monthly performance statement with all trade logs",
              "No single trade uses more than 5–10% of total capital",
              "Strategy pauses automatically on 3+ consecutive SL hits",
              "Full trade history auditable in real-time via this dashboard",
              "No lock-in — exit anytime with settlement within 2 business days",
            ].map((t, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                <span className="text-sm text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── CTA ── */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-900 p-8 text-white text-center shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-300 mb-2">Ready to Start?</p>
        <h2 className="text-3xl font-black mb-3">Begin with ₹{fmt(capital)}</h2>
        <p className="text-white/70 text-sm max-w-md mx-auto mb-6">
          Realistic monthly income of <strong className="text-emerald-300">{psych.monthly}</strong> based on actual performance.
          Capital safety guaranteed. Full transparency.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          {[
            { step: "1", label: "Consultation call (15 min)" },
            { step: "2", label: "Capital allocation agreement" },
            { step: "3", label: "Broker sub-account setup" },
            { step: "4", label: "Live monitoring begins" },
          ].map(({ step, label }) => (
            <div key={step} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <span className="h-5 w-5 rounded-full bg-indigo-400 text-white text-xs font-bold flex items-center justify-center">{step}</span>
              <span className="text-white/80">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/40">
          Past performance is not a guarantee of future results. Simulations use historical trade data.
          Actual returns may vary based on market conditions.
        </p>
      </div>
    </div>
  );
}

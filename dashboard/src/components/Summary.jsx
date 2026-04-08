import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart2,
  DollarSign,
  Clock,
  Activity,
  Award,
} from "lucide-react";

const CARD_CONFIGS = [
  {
    key: "totalTrades",
    title: "Total Trades",
    gradient: "from-violet-600 to-indigo-700",
    glow: "shadow-indigo-500/30",
    icon: BarChart2,
  },
  {
    key: "winRate",
    title: "Win Rate",
    gradient: "from-emerald-500 to-teal-700",
    glow: "shadow-emerald-500/30",
    icon: Award,
  },
  {
    key: "profitFactor",
    title: "Profit Factor",
    gradient: "from-sky-500 to-blue-700",
    glow: "shadow-sky-500/30",
    icon: Activity,
  },
  {
    key: "averageROI",
    title: "Average ROI",
    gradient: "from-orange-500 to-amber-600",
    glow: "shadow-orange-500/30",
    icon: Target,
  },
  {
    key: "totalProfit",
    title: "Net P&L",
    gradient: "from-rose-500 to-pink-700",
    glow: "shadow-rose-500/30",
    icon: DollarSign,
  },
  {
    key: "averageDuration",
    title: "Avg Duration",
    gradient: "from-slate-600 to-slate-800",
    glow: "shadow-slate-500/30",
    icon: Clock,
  },
];

function SummaryCard({ config, value, description, trend }) {
  const Icon = config.icon;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-5 shadow-xl ${config.glow} hover:scale-105 transition-transform duration-200 cursor-default`}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 h-16 w-16 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            {config.title}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white drop-shadow">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-white/60">{description}</p>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {trend >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-300" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-300" />
          )}
          <span className={`text-xs font-semibold ${trend >= 0 ? "text-green-300" : "text-red-300"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
          <span className="text-xs text-white/50">vs avg</span>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ sheet1Count, archiveCount }) {
  const total = sheet1Count + archiveCount;
  if (total === 0) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-muted-foreground">Data Sources:</span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
        <span className="h-2 w-2 rounded-full bg-indigo-500" />
        Sheet1: {sheet1Count} trades
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Archive: {archiveCount} trades
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Total: {total} trades
      </span>
    </div>
  );
}

function Summary({ metrics, trades }) {
  if (!metrics) return null;

  const { totalTrades, winRate, averageROI, totalProfit, averageDuration } = metrics;

  const sheet1Count = (trades || []).filter((t) => t._source === "Sheet1").length;
  const archiveCount = (trades || []).filter((t) => t._source === "Archive").length;

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "-";
    const abs = Math.abs(num);
    const prefix = num < 0 ? "-" : "+";
    return `${prefix}₹${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(abs)}`;
  };

  const profitFactor =
    totalTrades > 0 && 100 - winRate > 0
      ? (winRate / (100 - winRate)).toFixed(2)
      : "0.00";

  const cardValues = {
    totalTrades: totalTrades.toString(),
    winRate: `${parseFloat(winRate).toFixed(1)}%`,
    profitFactor: profitFactor,
    averageROI: `${parseFloat(averageROI).toFixed(1)}%`,
    totalProfit: formatCurrency(totalProfit),
    averageDuration: `${parseFloat(averageDuration).toFixed(0)}m`,
  };

  const cardDescriptions = {
    totalTrades: `${sheet1Count} active · ${archiveCount} archived`,
    winRate: parseFloat(winRate) >= 50 ? "Above target" : "Below target",
    profitFactor: "Gross profit ÷ gross loss",
    averageROI: "Per trade return",
    totalProfit: "Across all trades",
    averageDuration: "Average hold time",
  };

  return (
    <div className="mb-8">
      <SourceBadge sheet1Count={sheet1Count} archiveCount={archiveCount} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {CARD_CONFIGS.map((config) => (
          <SummaryCard
            key={config.key}
            config={config}
            value={cardValues[config.key]}
            description={cardDescriptions[config.key]}
          />
        ))}
      </div>
    </div>
  );
}

export default Summary;

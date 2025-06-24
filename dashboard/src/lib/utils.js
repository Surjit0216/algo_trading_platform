import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Group trades by key (e.g., Signal, Index, Timeframe)
export function groupBy(trades, key) {
  return trades.reduce((acc, trade) => {
    const k = trade[key] || "Unknown";
    if (!acc[k]) acc[k] = [];
    acc[k].push(trade);
    return acc;
  }, {});
}

// Compute win rate, avg profit, trade count by group
export function computeSetupStats(
  trades,
  groupKeys = ["Signal", "Index", "Timeframe"]
) {
  const grouped = {};
  trades.forEach((trade) => {
    const key = groupKeys.map((k) => trade[k] || "-").join("|");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(trade);
  });
  return Object.entries(grouped).map(([key, group]) => {
    const wins = group.filter(
      (t) => parseFloat(t["Profit (INR)"] || 0) > 0
    ).length;
    const total = group.length;
    const avgProfit =
      group.reduce((sum, t) => sum + parseFloat(t["Profit (INR)"] || 0), 0) /
      total;
    return {
      key,
      winRate: total ? (wins / total) * 100 : 0,
      avgProfit,
      count: total,
      group,
    };
  });
}

// Target hit funnel: % of trades hitting T1, T2, ..., T6
export function computeTargetFunnel(trades) {
  const total = trades.length;
  const funnel = [];
  for (let i = 1; i <= 6; ++i) {
    const hit = trades.filter(
      (t) => String(t[`T${i}Hit`] || "").toLowerCase() === "true"
    ).length;
    funnel.push({
      target: `T${i}`,
      hitCount: hit,
      hitRate: total ? (hit / total) * 100 : 0,
    });
  }
  return funnel;
}

// Optimal exit profit if always exited at T1, T2, ..., T6
export function computeOptimalExit(trades) {
  const results = [];
  for (let i = 1; i <= 6; ++i) {
    let totalProfit = 0;
    let count = 0;
    trades.forEach((t) => {
      if (t[`T${i}`] && String(t[`T${i}Hit`] || "").toLowerCase() === "true") {
        totalProfit +=
          parseFloat(t[`T${i}`] || 0) - parseFloat(t["Strike"] || 0);
        count++;
      }
    });
    results.push({
      exitAt: `T${i}`,
      avgProfit: count ? totalProfit / count : 0,
      count,
    });
  }
  return results;
}

// Best setups: top N by win rate and avg profit
export function getBestSetups(setupStats, N = 5) {
  return [...setupStats]
    .sort((a, b) => b.winRate - a.winRate || b.avgProfit - a.avgProfit)
    .slice(0, N);
}

// Profit vs. trade duration
export function profitVsDuration(trades) {
  return trades.map((t) => ({
    duration: parseFloat(t["Trade Duration"] || 0),
    profit: parseFloat(t["Profit (INR)"] || 0),
  }));
}

// Profit by time of day (hour)
export function profitByHour(trades) {
  const byHour = {};
  trades.forEach((t) => {
    const entry = t["Entry Timestamp (UTC)"] || t["Date"] || "";
    const hour = entry.match(/\b(\d{1,2}):/)
      ? parseInt(entry.match(/\b(\d{1,2}):/)[1], 10)
      : null;
    if (hour !== null) {
      if (!byHour[hour]) byHour[hour] = [];
      byHour[hour].push(parseFloat(t["Profit (INR)"] || 0));
    }
  });
  return Object.entries(byHour).map(([hour, profits]) => ({
    hour: parseInt(hour, 10),
    avgProfit: profits.length
      ? profits.reduce((a, b) => a + b, 0) / profits.length
      : 0,
    count: profits.length,
  }));
}

// Drawdown series
export function computeDrawdown(trades) {
  let peak = 0;
  let equity = 0;
  const series = [];
  trades.forEach((t) => {
    equity += parseFloat(t["Profit (INR)"] || 0);
    if (equity > peak) peak = equity;
    const drawdown = equity - peak;
    series.push({
      equity,
      drawdown,
    });
  });
  return series;
}

// Slippage: TradingView/Webhook/Entry/Exit time differences
export function computeSlippage(trades) {
  return trades.map((t) => {
    const parseTime = (s) => (s ? new Date(s.replace(/-/g, "/")) : null);
    const tv = parseTime(t["TradingView Time (UTC)"]);
    const webhook = parseTime(t["Webhook Time (UTC)"]);
    const entry = parseTime(t["Entry Timestamp (UTC)"]);
    const exit = parseTime(t["Exit Timestamp (UTC)"]);
    return {
      TrackingID: t.TrackingID,
      tvToWebhook: tv && webhook ? (webhook - tv) / 1000 : null,
      webhookToEntry: webhook && entry ? (entry - webhook) / 1000 : null,
      entryToExit: entry && exit ? (exit - entry) / 1000 : null,
    };
  });
}

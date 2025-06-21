import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Sigma,
  CheckCircle,
  Clock,
} from "lucide-react";

const SummaryCard = ({ title, value, description, icon, colorClass }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${colorClass || ""}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

function Summary({ metrics }) {
  if (!metrics) return null;

  const { totalTrades, winRate, averageROI, totalProfit, averageDuration } =
    metrics;

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

  const profitFactor =
    totalTrades > 0 && 100 - winRate > 0
      ? (winRate / (100 - winRate)).toFixed(2)
      : "0.00";

  return (
    <div className="mb-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="Total Trades"
          value={totalTrades}
          description="Total number of trades executed"
          icon={<Sigma className="w-4 h-4 text-muted-foreground" />}
        />
        <SummaryCard
          title="Win Rate"
          value={formatPercentage(winRate)}
          description="Percentage of profitable trades"
          icon={<CheckCircle className="w-4 h-4 text-muted-foreground" />}
          colorClass={winRate >= 50 ? "text-green-500" : "text-destructive"}
        />
        <SummaryCard
          title="Profit Factor"
          value={profitFactor}
          description="Gross profit / gross loss"
          icon={<Percent className="w-4 h-4 text-muted-foreground" />}
        />
        <SummaryCard
          title="Average ROI"
          value={formatPercentage(averageROI)}
          description="Average return on investment per trade"
          icon={
            averageROI >= 0 ? (
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
            )
          }
          colorClass={averageROI >= 0 ? "text-green-500" : "text-destructive"}
        />
        <SummaryCard
          title="Net P&L"
          value={formatCurrency(totalProfit)}
          description="Total profit or loss"
          icon={
            totalProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
            )
          }
          colorClass={totalProfit >= 0 ? "text-green-500" : "text-destructive"}
        />
        <SummaryCard
          title="Avg. Duration"
          value={`${parseFloat(averageDuration).toFixed(1)}m`}
          description="Average trade holding time"
          icon={<Clock className="w-4 h-4 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}

export default Summary;

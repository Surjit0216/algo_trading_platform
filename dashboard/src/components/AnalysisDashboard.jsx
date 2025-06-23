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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Portfolio Analysis Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <div className="text-sm text-muted-foreground">Net Profit</div>
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
                  <CardTitle className="text-sm">Trade Distribution</CardTitle>
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
              <h3 className="text-lg font-semibold mb-4">Index Performance</h3>
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
              <h3 className="text-lg font-semibold mb-4">Timeframe Analysis</h3>
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
                        <div>Avg Duration: {stats.avgDuration.toFixed(1)}m</div>
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
                <div className="text-sm text-muted-foreground">Max Profit</div>
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
                <div className="text-sm text-muted-foreground">Avg Profit</div>
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
                      {analysisData.winRate > 60 ? "Good" : "Needs Improvement"}
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
  );
}

export default AnalysisDashboard;

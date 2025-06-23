import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Percent,
  Timer,
} from "lucide-react";

function TradeAnalysis({ trade, currentPrice = null }) {
  const [realTimePL, setRealTimePL] = useState(0);
  const [realTimeROI, setRealTimeROI] = useState(0);
  const [exitRecommendations, setExitRecommendations] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState({});

  // Calculate real-time P&L and ROI
  useEffect(() => {
    if (!trade || !currentPrice) return;

    const entryPrice = parseFloat(trade["Entry Price"] || 0);
    const quantity = parseFloat(trade["Quantity"] || 1);
    const signal = trade.Signal;

    if (entryPrice && currentPrice) {
      let profit = 0;
      if (signal === "Buy") {
        profit = (currentPrice - entryPrice) * quantity;
      } else {
        profit = (entryPrice - currentPrice) * quantity;
      }

      const investment = entryPrice * quantity;
      const roi = investment > 0 ? (profit / investment) * 100 : 0;

      setRealTimePL(profit);
      setRealTimeROI(roi);
    }
  }, [trade, currentPrice]);

  // Generate exit strategy recommendations
  useEffect(() => {
    if (!trade) return;

    const recommendations = [];
    const profit = parseFloat(trade["Profit (INR)"] || 0);
    const roi = parseFloat(trade.ROI || 0);
    const duration = parseFloat(trade["Trade Duration"] || 0);
    const signal = trade.Signal;

    // Profit-based recommendations
    if (profit > 1000) {
      recommendations.push({
        type: "profit",
        priority: "high",
        message: "Strong profit - Consider partial exit",
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        action: "Take partial profits at 50% of current profit",
      });
    } else if (profit < -500) {
      recommendations.push({
        type: "loss",
        priority: "high",
        message: "Significant loss - Review stop loss",
        icon: <TrendingDown className="w-4 h-4 text-red-500" />,
        action: "Consider tightening stop loss or exit if trend continues",
      });
    }

    // ROI-based recommendations
    if (roi > 5) {
      recommendations.push({
        type: "roi",
        priority: "medium",
        message: "Good ROI achieved",
        icon: <Percent className="w-4 h-4 text-green-500" />,
        action: "Monitor for exit signals",
      });
    } else if (roi < -3) {
      recommendations.push({
        type: "roi",
        priority: "high",
        message: "Poor ROI - Risk management needed",
        icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
        action: "Consider reducing position size or exit",
      });
    }

    // Time-based recommendations
    if (duration > 60) {
      recommendations.push({
        type: "time",
        priority: "medium",
        message: "Trade running long",
        icon: <Clock className="w-4 h-4 text-blue-500" />,
        action: "Review if trade thesis still valid",
      });
    }

    // Target-based recommendations
    const hitTargets = Array.from({ length: 6 }, (_, i) => i + 1).filter(
      (num) => trade[`T${num}Hit`] === "true"
    ).length;

    if (hitTargets >= 3) {
      recommendations.push({
        type: "target",
        priority: "high",
        message: "Multiple targets hit",
        icon: <Target className="w-4 h-4 text-green-500" />,
        action: "Consider booking profits",
      });
    }

    setExitRecommendations(recommendations);
  }, [trade]);

  // Calculate risk metrics
  useEffect(() => {
    if (!trade) return;

    const profit = parseFloat(trade["Profit (INR)"] || 0);
    const volume = parseFloat(trade.Volume || 0);
    const points = parseFloat(trade.Points || 0);
    const duration = parseFloat(trade["Trade Duration"] || 0);

    const metrics = {
      riskRewardRatio: points > 0 ? Math.abs(profit / points) : 0,
      profitPerMinute: duration > 0 ? profit / duration : 0,
      volumeEfficiency: volume > 0 ? profit / volume : 0,
      volatility:
        Math.abs(profit) > 1000
          ? "High"
          : Math.abs(profit) > 500
          ? "Medium"
          : "Low",
    };

    setRiskMetrics(metrics);
  }, [trade]);

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50 dark:bg-red-950/20";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
      case "low":
        return "border-green-500 bg-green-50 dark:bg-green-950/20";
      default:
        return "border-gray-300 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  if (!trade) return null;

  return (
    <div className="space-y-6">
      {/* Real-time P&L Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Real-time Profit & Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {formatCurrency(realTimePL)}
              </div>
              <div className="text-sm text-muted-foreground">Current P&L</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {formatPercentage(realTimeROI)}
              </div>
              <div className="text-sm text-muted-foreground">Current ROI</div>
            </div>
          </div>
          {currentPrice && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>Current Price:</strong> ₹{currentPrice.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Entry: ₹{parseFloat(trade["Entry Price"] || 0).toFixed(2)} |
                Signal: {trade.Signal}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exit Strategy Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Exit Strategy Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exitRecommendations.length > 0 ? (
            <div className="space-y-3">
              {exitRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 border-l-4 rounded-r-lg ${getPriorityColor(
                    rec.priority
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    {rec.icon}
                    <div className="flex-1">
                      <div className="font-semibold">{rec.message}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {rec.action}
                      </div>
                    </div>
                    <Badge
                      variant={
                        rec.priority === "high" ? "destructive" : "secondary"
                      }
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No specific exit recommendations at this time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">
                Risk/Reward Ratio
              </div>
              <div className="text-lg font-semibold">
                {riskMetrics.riskRewardRatio?.toFixed(2) || "-"}
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Profit/Minute</div>
              <div className="text-lg font-semibold">
                {formatCurrency(riskMetrics.profitPerMinute || 0)}
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">
                Volume Efficiency
              </div>
              <div className="text-lg font-semibold">
                {riskMetrics.volumeEfficiency?.toFixed(2) || "-"}
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Volatility</div>
              <div className="text-lg font-semibold">
                {riskMetrics.volatility || "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Total Profit:</span>
              <span
                className={`font-semibold ${
                  parseFloat(trade["Profit (INR)"] || 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {formatCurrency(trade["Profit (INR)"])}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>ROI:</span>
              <span
                className={`font-semibold ${
                  parseFloat(trade.ROI || 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {formatPercentage(trade.ROI)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Trade Duration:</span>
              <span className="font-semibold">
                {trade["Trade Duration"]
                  ? `${parseFloat(trade["Trade Duration"]).toFixed(1)} minutes`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <Badge
                variant={trade.Status === "Closed" ? "secondary" : "default"}
              >
                {trade.Status || "Active"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TradeAnalysis;

import React, { useMemo } from "react";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

function ChartContainer({ title, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">{children}</div>
      </CardContent>
    </Card>
  );
}

function Charts({ data, theme }) {
  if (!data || !data.length) return null;

  const chartData = useMemo(() => {
    // Group data by date for daily analysis
    const dailyData = data.reduce((acc, trade) => {
      const fullDate = trade.Date || trade.date || "Unknown";
      if (fullDate === "Unknown") return acc;

      const datePart = fullDate.split(" ")[0]; // "15-06-2025"
      if (!datePart) return acc;

      if (!acc[datePart]) {
        acc[datePart] = {
          profit: 0,
          trades: 0,
          wins: 0,
          losses: 0,
        };
      }
      const profit = parseFloat(trade["Profit (INR)"] || 0);
      if (!isNaN(profit)) {
        acc[datePart].profit += profit;
        if (profit > 0) acc[datePart].wins += 1;
        else acc[datePart].losses += 1;
      }
      acc[datePart].trades += 1;
      return acc;
    }, {});

    const sortedDates = Object.keys(dailyData).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split("-");
      const [dayB, monthB, yearB] = b.split("-");
      return (
        new Date(`${yearA}-${monthA}-${dayA}`) -
        new Date(`${yearB}-${monthB}-${dayB}`)
      );
    });

    const formattedDates = sortedDates.map((date) => {
      const [day, month] = date.split("-");
      return `${day}/${month}`;
    });

    const dailyProfit = sortedDates.map((date) => dailyData[date].profit);
    const dailyTrades = sortedDates.map((date) => dailyData[date].trades);

    // ROI data
    const roiData = data.map((d) => parseFloat(d.ROI || 0));
    const profitData = data.map((d) => parseFloat(d["Profit (INR)"] || 0));

    // Cumulative P&L
    let cumulative = 0;
    const cumulativePnL = profitData.map((p) => {
      cumulative += p;
      return parseFloat(cumulative.toFixed(2));
    });

    // Target analysis
    const targetHits = {
      T1: data.filter((d) => String(d.T1Hit || "").toLowerCase() === "true")
        .length,
      T2: data.filter((d) => String(d.T2Hit || "").toLowerCase() === "true")
        .length,
      T3: data.filter((d) => String(d.T3Hit || "").toLowerCase() === "true")
        .length,
      T4: data.filter((d) => String(d.T4Hit || "").toLowerCase() === "true")
        .length,
      T5: data.filter((d) => String(d.T5Hit || "").toLowerCase() === "true")
        .length,
      T6: data.filter((d) => String(d.T6Hit || "").toLowerCase() === "true")
        .length,
    };

    const targetMisses = {
      T1: data.length - targetHits.T1,
      T2: data.length - targetHits.T2,
      T3: data.length - targetHits.T3,
      T4: data.length - targetHits.T4,
      T5: data.length - targetHits.T5,
      T6: data.length - targetHits.T6,
    };

    // Signal analysis
    const buyTrades = data.filter((d) => d.Signal === "Buy");
    const sellTrades = data.filter((d) => d.Signal === "Sell");
    const buyWins = buyTrades.filter(
      (d) => parseFloat(d["Profit (INR)"] || 0) > 0
    ).length;
    const sellWins = sellTrades.filter(
      (d) => parseFloat(d["Profit (INR)"] || 0) > 0
    ).length;

    return {
      dates: formattedDates,
      dailyProfit,
      dailyTrades,
      roiData,
      profitData,
      cumulativePnL,
      targetHits,
      targetMisses,
      buyTrades: buyTrades.length,
      sellTrades: sellTrades.length,
      buyWins,
      sellWins,
    };
  }, [data]);

  const chartOptions = useMemo(() => {
    const isLightTheme = theme === "light";
    const textColor = isLightTheme ? "#121212" : "#e0e0e0";
    const gridColor = isLightTheme
      ? "rgba(0, 0, 0, 0.1)"
      : "rgba(255, 255, 255, 0.1)";
    const tooltipBgColor = isLightTheme
      ? "rgba(255, 255, 255, 0.9)"
      : "rgba(0, 0, 0, 0.8)";
    const tooltipTitleColor = textColor;
    const tooltipBodyColor = textColor;
    const accentColor = isLightTheme ? "#007bff" : "#00d4ff";

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: tooltipBgColor,
          titleColor: tooltipTitleColor,
          bodyColor: tooltipBodyColor,
          borderColor: accentColor,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },
        y: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },
      },
    };
  }, [theme]);

  const dailyProfitChart = {
    labels: chartData.dates,
    datasets: [
      {
        label: "Daily Profit (INR)",
        data: chartData.dailyProfit,
        backgroundColor: chartData.dailyProfit.map((p) =>
          p >= 0 ? "rgba(76, 175, 80, 0.6)" : "rgba(255, 107, 107, 0.6)"
        ),
        borderColor: chartData.dailyProfit.map((p) =>
          p >= 0 ? "#4caf50" : "#ff6b6b"
        ),
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  const roiChart = {
    labels: data.map((_, index) => `#${index + 1}`),
    datasets: [
      {
        label: "ROI (%)",
        data: chartData.roiData,
        borderColor: theme === "light" ? "#007bff" : "#00d4ff",
        backgroundColor:
          theme === "light"
            ? "rgba(0, 123, 255, 0.1)"
            : "rgba(0, 212, 255, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const cumulativeChart = {
    labels: data.map((_, index) => `#${index + 1}`),
    datasets: [
      {
        label: "Cumulative P&L (₹)",
        data: chartData.cumulativePnL,
        borderColor: "#a78bfa",
        backgroundColor: "rgba(167, 139, 250, 0.15)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const targetChart = {
    labels: Object.keys(chartData.targetHits),
    datasets: [
      {
        label: "Targets Hit",
        data: Object.values(chartData.targetHits),
        backgroundColor: "rgba(76, 175, 80, 0.8)",
        borderColor: "#4caf50",
        borderWidth: 2,
      },
      {
        label: "Targets Missed",
        data: Object.values(chartData.targetMisses),
        backgroundColor: "rgba(255, 107, 107, 0.8)",
        borderColor: "#ff6b6b",
        borderWidth: 2,
      },
    ],
  };

  const signalChart = {
    labels: ["Buy Wins", "Buy Losses", "Sell Wins", "Sell Losses"],
    datasets: [
      {
        data: [
          chartData.buyWins,
          chartData.buyTrades - chartData.buyWins,
          chartData.sellWins,
          chartData.sellTrades - chartData.sellWins,
        ],
        backgroundColor: [
          "rgba(76, 175, 80, 0.8)",
          "rgba(255, 107, 107, 0.8)",
          "rgba(76, 175, 80, 0.6)",
          "rgba(255, 107, 107, 0.6)",
        ],
        borderColor: ["#4caf50", "#ff6b6b", "#4caf50", "#ff6b6b"],
        borderWidth: 2,
      },
    ],
  };

  const winLossChart = {
    labels: ["Winning Trades", "Losing Trades"],
    datasets: [
      {
        data: [
          data.filter((d) => parseFloat(d["Profit (INR)"] || 0) > 0).length,
          data.filter((d) => parseFloat(d["Profit (INR)"] || 0) <= 0).length,
        ],
        backgroundColor: ["rgba(76, 175, 80, 0.8)", "rgba(255, 107, 107, 0.8)"],
        borderColor: ["#4caf50", "#ff6b6b"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Full-width cumulative P&L — spans all columns */}
      <div className="md:col-span-2 lg:col-span-3">
        <ChartContainer title="📈 Cumulative P&L Growth (₹)">
          <div className="h-56">
            <Line data={cumulativeChart} options={chartOptions} />
          </div>
        </ChartContainer>
      </div>

      <ChartContainer title="📊 Daily Profit/Loss">
        <Bar data={dailyProfitChart} options={chartOptions} />
      </ChartContainer>

      <ChartContainer title="📉 ROI Per Trade">
        <Line data={roiChart} options={chartOptions} />
      </ChartContainer>

      <ChartContainer title="🎯 Target Hit Distribution">
        <Bar data={targetChart} options={chartOptions} />
      </ChartContainer>

      <ChartContainer title="✅ Win/Loss Ratio">
        <Doughnut data={winLossChart} options={chartOptions} />
      </ChartContainer>

      <ChartContainer title="🔄 Signal Performance">
        <Pie data={signalChart} options={chartOptions} />
      </ChartContainer>

      <ChartContainer title="📅 Trade Volume by Day">
        <Bar
          data={{
            labels: chartData.dates,
            datasets: [
              {
                label: "Number of Trades",
                data: chartData.dailyTrades,
                backgroundColor:
                  theme === "light"
                    ? "rgba(0, 123, 255, 0.6)"
                    : "rgba(0, 212, 255, 0.6)",
                borderColor: theme === "light" ? "#007bff" : "#00d4ff",
                borderWidth: 2,
                borderRadius: 4,
              },
            ],
          }}
          options={chartOptions}
        />
      </ChartContainer>
    </div>
  );
}

export default Charts;

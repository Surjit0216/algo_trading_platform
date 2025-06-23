import React, { useState, useEffect, createContext, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Create context for price data
const PriceContext = createContext();

export const usePrices = () => {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error("usePrices must be used within a PriceProvider");
  }
  return context;
};

// Simulated price data for different indices
const INITIAL_PRICES = {
  NIFTY: 19500,
  BANKNIFTY: 44500,
  FINNIFTY: 20500,
  SENSEX: 65000,
  MIDCPNIFTY: 12000,
};

// Price volatility ranges (percentage)
const VOLATILITY_RANGES = {
  NIFTY: { min: -0.5, max: 0.5 },
  BANKNIFTY: { min: -0.8, max: 0.8 },
  FINNIFTY: { min: -0.6, max: 0.6 },
  SENSEX: { min: -0.4, max: 0.4 },
  MIDCPNIFTY: { min: -0.7, max: 0.7 },
};

function PriceService({ children }) {
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [priceChanges, setPriceChanges] = useState({});
  const [isLive, setIsLive] = useState(true);

  // Generate random price change
  const generatePriceChange = (index) => {
    const currentPrice = prices[index];
    const volatility = VOLATILITY_RANGES[index];
    const changePercent =
      Math.random() * (volatility.max - volatility.min) + volatility.min;
    const changeAmount = currentPrice * (changePercent / 100);
    return {
      newPrice: currentPrice + changeAmount,
      change: changeAmount,
      changePercent: changePercent,
    };
  };

  // Update prices every 5 seconds
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setPrices((prevPrices) => {
        const newPrices = {};
        const newChanges = {};

        Object.keys(prevPrices).forEach((index) => {
          const { newPrice, change, changePercent } =
            generatePriceChange(index);
          newPrices[index] = Math.round(newPrice * 100) / 100; // Round to 2 decimal places
          newChanges[index] = {
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
          };
        });

        setPriceChanges(newChanges);
        return newPrices;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getCurrentPrice = (index) => {
    return prices[index] || 0;
  };

  const getPriceChange = (index) => {
    return priceChanges[index] || { change: 0, changePercent: 0 };
  };

  const value = {
    prices,
    priceChanges,
    isLive,
    setIsLive,
    getCurrentPrice,
    getPriceChange,
  };

  return (
    <PriceContext.Provider value={value}>{children}</PriceContext.Provider>
  );
}

// Price Display Component
function PriceDisplay() {
  const { prices, priceChanges, isLive, setIsLive } = usePrices();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}`;
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Market Prices</span>
          <div className="flex items-center gap-2">
            <Badge variant={isLive ? "default" : "secondary"}>
              {isLive ? "LIVE" : "PAUSED"}
            </Badge>
            <button
              onClick={() => setIsLive(!isLive)}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
            >
              {isLive ? "Pause" : "Resume"}
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(prices).map(([index, price]) => {
            const change = priceChanges[index]?.change || 0;
            const changePercent = priceChanges[index]?.changePercent || 0;

            return (
              <div key={index} className="p-3 border rounded-lg">
                <div className="font-semibold text-sm">{index}</div>
                <div className="text-lg font-bold">{formatPrice(price)}</div>
                <div
                  className={`text-sm flex items-center gap-1 ${getChangeColor(
                    change
                  )}`}
                >
                  {getChangeIcon(change)}
                  <span>
                    {formatChange(change)} ({formatChange(changePercent)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Prices update every 5 seconds • Simulated data for demonstration
        </div>
      </CardContent>
    </Card>
  );
}

export { PriceService, PriceDisplay };

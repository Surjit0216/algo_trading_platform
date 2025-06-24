import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradeAnalysis from "./TradeAnalysis";
import { usePrices } from "./PriceService";

function TradeModal({ trade, onClose }) {
  const [activeTab, setActiveTab] = useState("details");
  const { getCurrentPrice } = usePrices();

  if (!trade) return null;

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(num);
  };

  const formatPercentage = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "-";
    return `${num.toFixed(2)}%`;
  };

  const getTargetStatus = (hit) => {
    const hitValue = String(hit || "").toLowerCase();
    if (hitValue === "true")
      return <span className="text-green-500">✅ Hit</span>;
    return <span className="text-destructive">❌ Missed</span>;
  };

  const DetailItem = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-border/50">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );

  const currentPrice = getCurrentPrice(trade.Index);

  return (
    <Dialog open={!!trade} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Trade Details</span>
            <Badge
              variant={trade.Signal === "Buy" ? "secondary" : "destructive"}
            >
              {trade.Signal} {trade.Index} @ {trade.Strike}
            </Badge>
          </DialogTitle>
          <DialogDescription>{trade.Date}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-8 py-4 md:grid-cols-2">
              {/* Basic Info Section */}
              <div className="space-y-2">
                <h4 className="font-semibold">Basic Info</h4>
                <dl>
                  <DetailItem label="Date" value={trade.Date || "-"} />
                  <DetailItem label="Signal" value={trade.Signal || "-"} />
                  <DetailItem label="Index" value={trade.Index || "-"} />
                  <DetailItem label="Strike" value={trade.Strike || "-"} />
                  <DetailItem
                    label="Timeframe"
                    value={trade.Timeframe || "-"}
                  />
                  <DetailItem label="Status" value={trade.Status || "-"} />
                  <DetailItem
                    label="Tracking ID"
                    value={trade.TrackingID || "-"}
                  />
                </dl>
              </div>

              {/* Trade Metrics Section */}
              <div className="space-y-2">
                <h4 className="font-semibold">Trade Metrics</h4>
                <dl>
                  <DetailItem label="Volume" value={trade.Volume || "-"} />
                  <DetailItem label="Points" value={trade.Points || "-"} />
                  <DetailItem
                    label="Profit (INR)"
                    value={formatCurrency(trade["Profit (INR)"])}
                  />
                  <DetailItem
                    label="% Move Captured"
                    value={trade["% Move Captured"] || "-"}
                  />
                  <DetailItem
                    label="ROI % on Capital"
                    value={trade["ROI % on Capital"] || "-"}
                  />
                  <DetailItem
                    label="Final Target Price"
                    value={trade.FinalTargetPrice || "-"}
                  />
                  <DetailItem
                    label="Target Hit Count"
                    value={trade["Target Hit Count"] || "-"}
                  />
                  <DetailItem
                    label="Trade Duration"
                    value={trade["Trade Duration"] || "-"}
                  />
                  <DetailItem
                    label="Time Taken"
                    value={trade["TimeTaken"] || "-"}
                  />
                </dl>
              </div>

              {/* Targets Section */}
              <div className="col-span-1 md:col-span-2">
                <h4 className="font-semibold">Targets</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 sm:grid-cols-3 md:grid-cols-6">
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                    <div key={`T${num}`} className="p-3 border rounded-md">
                      <div className="font-mono text-sm text-muted-foreground">
                        T{num}: {trade[`T${num}`] || "-"}
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {getTargetStatus(trade[`T${num}Hit`])}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {trade[`T${num} Timestamp`]
                          ? `@ ${trade[`T${num} Timestamp`]}`
                          : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamps Section */}
              <div className="space-y-2">
                <h4 className="font-semibold">Timestamps</h4>
                <dl>
                  <DetailItem
                    label="Entry Timestamp (UTC)"
                    value={trade["Entry Timestamp (UTC)"] || "-"}
                  />
                  <DetailItem
                    label="Exit Timestamp (UTC)"
                    value={trade["Exit Timestamp (UTC)"] || "-"}
                  />
                  <DetailItem
                    label="TradingView Time (UTC)"
                    value={trade["TradingView Time (UTC)"] || "-"}
                  />
                  <DetailItem
                    label="Webhook Time (UTC)"
                    value={trade["Webhook Time (UTC)"] || "-"}
                  />
                </dl>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <TradeAnalysis trade={trade} currentPrice={currentPrice} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default TradeModal;

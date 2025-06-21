import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function TradeTable({ data, onSelect }) {
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
        <div>
          <h3 className="text-lg font-semibold">No trades found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or wait for new data.
          </p>
        </div>
      </div>
    );
  }

  const columns = [
    "Date",
    "Signal",
    "Index",
    "Strike",
    "Timeframe",
    "Profit (INR)",
    "ROI",
    "Status",
  ];

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

  return (
    <div className="overflow-hidden border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow
              key={idx}
              onClick={() => onSelect(row)}
              className="cursor-pointer"
            >
              <TableCell>{row["Date"] || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    row["Signal"] === "Buy" ? "secondary" : "destructive"
                  }
                >
                  {row["Signal"]}
                </Badge>
              </TableCell>
              <TableCell>{row["Index"] || "-"}</TableCell>
              <TableCell>{row["Strike"] || "-"}</TableCell>
              <TableCell>{row["Timeframe"] || "-"}</TableCell>
              <TableCell
                className={
                  parseFloat(row["Profit (INR)"] || 0) >= 0
                    ? "text-green-500"
                    : "text-destructive"
                }
              >
                {formatCurrency(row["Profit (INR)"])}
              </TableCell>
              <TableCell
                className={
                  parseFloat(row["ROI"] || 0) >= 0
                    ? "text-green-500"
                    : "text-destructive"
                }
              >
                {formatPercentage(row["ROI"])}
              </TableCell>
              <TableCell>{row["Status"] || "Active"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TradeTable;

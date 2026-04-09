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

  // Only show summary columns in the table
  const columns = [
    "Signal Date",
    "Signal",
    "Index",
    "Strike",
    "Status",
    "Entry Price",
    "Total P&L",
    "ROI",
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

  const getPLColor = (profit) => {
    const num = parseFloat(profit);
    if (isNaN(num)) return "";
    return num >= 0 ? "text-green-500" : "text-red-500";
  };

  // Helper to show value or fallback
  const show = (val, fallback = "-") =>
    val !== undefined && val !== null && val !== "" ? val : fallback;

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
          {data.map((row, idx) => {
            const totalPL = parseFloat(row["Profit (INR)"] || 0);
            return (
              <TableRow
                key={idx}
                onClick={() => onSelect(row)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>{show(row["Signal Date"] || row["Date"])}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row["Signal"] === "Buy" ? "secondary" : "destructive"
                    }
                  >
                    {show(row["Signal"])}
                  </Badge>
                </TableCell>
                <TableCell>{show(row["Index"])}</TableCell>
                <TableCell>{show(row["Strike"])}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row["Status"] === "Closed" ||
                      row["Status"] === "Completed"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {show(row["Status"], "Active")}
                  </Badge>
                </TableCell>
                <TableCell>
                  ₹
                  {parseFloat(row["Entry Premium"] || row["Entry Price"] || row["Strike"] || 0).toFixed(2)}
                </TableCell>
                <TableCell className={`font-semibold ${getPLColor(totalPL)}`}>
                  {formatCurrency(row["Profit (INR)"])}
                </TableCell>
                <TableCell
                  className={
                    parseFloat(row["ROI"] || row["ROI % on Capital"] || 0) >= 0
                      ? "text-green-500"
                      : "text-destructive"
                  }
                >
                  {formatPercentage(row["ROI"] || row["ROI % on Capital"])}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default TradeTable;

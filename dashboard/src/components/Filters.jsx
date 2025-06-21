import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Filters({ filters, setFilters, options }) {
  const handleSelectChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value === "all" ? "" : value }));
  };

  const handleInputChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <Input
        type="text"
        name="search"
        placeholder="Search trades..."
        className="max-w-xs"
        value={filters.search || ""}
        onChange={handleInputChange}
      />

      <Select
        value={filters.index || "all"}
        onValueChange={(value) => handleSelectChange("index", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Indexes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Indexes</SelectItem>
          {options.indexes.map((i) => (
            <SelectItem key={i} value={i}>
              {i}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.timeframe || "all"}
        onValueChange={(value) => handleSelectChange("timeframe", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Timeframes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Timeframes</SelectItem>
          {options.timeframes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.signal || "all"}
        onValueChange={(value) => handleSelectChange("signal", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Signals" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Signals</SelectItem>
          {["Buy", "Sell"].map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.pnl || "all"}
        onValueChange={(value) => handleSelectChange("pnl", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Profit & Loss" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="profit">Profit</SelectItem>
          <SelectItem value="loss">Loss</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default Filters;

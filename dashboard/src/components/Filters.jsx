import React from 'react';

function Filters({ filters, setFilters, options }) {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="filters">
      <input
        type="text"
        name="search"
        placeholder="Search"
        value={filters.search || ''}
        onChange={handleChange}
      />
      <select name="index" value={filters.index || ''} onChange={handleChange}>
        <option value="">All Indexes</option>
        {options.indexes.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <select name="timeframe" value={filters.timeframe || ''} onChange={handleChange}>
        <option value="">All Timeframes</option>
        {options.timeframes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <select name="signal" value={filters.signal || ''} onChange={handleChange}>
        <option value="">All Signals</option>
        {['Buy', 'Sell'].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select name="pnl" value={filters.pnl || ''} onChange={handleChange}>
        <option value="">All</option>
        <option value="profit">Profit</option>
        <option value="loss">Loss</option>
      </select>
    </div>
  );
}

export default Filters;

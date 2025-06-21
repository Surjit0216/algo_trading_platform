import React from 'react';

function Summary({ metrics }) {
  if (!metrics) return null;
  const {
    totalTrades,
    winRate,
    averageROI,
    totalProfit,
    averageDuration,
    targetSuccess
  } = metrics;

  return (
    <div className="summary">
      <h2>Overview</h2>
      <div className="summary-grid">
        <div>Total Trades: {totalTrades}</div>
        <div>Win Rate: {winRate}%</div>
        <div>Average ROI: {averageROI}%</div>
        <div>Total Profit (INR): {totalProfit}</div>
        <div>Avg Duration: {averageDuration} min</div>
      </div>
      {targetSuccess && (
        <div className="targets">
          {Object.entries(targetSuccess).map(([t, val]) => (
            <div key={t}>{t}: {val}%</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Summary;

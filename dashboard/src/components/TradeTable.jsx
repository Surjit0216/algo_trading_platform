import React from 'react';

function TradeTable({ data, onSelect }) {
  if (!data || !data.length) return <div>No trades</div>;
  const headers = Object.keys(data[0]);
  return (
    <table className="trade-table">
      <thead>
        <tr>
          {headers.map(h => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} onClick={() => onSelect(row)}>
            {headers.map(h => <td key={h}>{row[h]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TradeTable;

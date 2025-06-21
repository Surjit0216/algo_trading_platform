import React from 'react';

function TradeModal({ trade, onClose }) {
  if (!trade) return null;
  const headers = Object.keys(trade);
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}>Close</button>
        <table>
          <tbody>
            {headers.map(h => (
              <tr key={h}>
                <td>{h}</td>
                <td>{trade[h]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TradeModal;

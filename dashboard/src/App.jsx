// Main dashboard application
import { useEffect, useState, useCallback } from 'react';
import './App.css';
import Summary from './components/Summary';
import Filters from './components/Filters';
import TradeTable from './components/TradeTable';
import TradeModal from './components/TradeModal';
import Charts from './components/Charts';
import Papa from 'papaparse';

const CSV_URL = import.meta.env.VITE_SHEET_CSV_URL;

function App() {
  const [trades, setTrades] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({ indexes: [], timeframes: [] });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!CSV_URL) return;
    fetch(CSV_URL)
      .then(res => res.text())
      .then(text => Papa.parse(text, { header: true }).data)
      .then(data => {
        const clean = data.filter(row => Object.values(row).some(v => v !== ''));
        setTrades(clean);
        setFiltered(clean);
        computeMetrics(clean);
        setOptions({
          indexes: Array.from(new Set(clean.map(r => r.Index).filter(Boolean))),
          timeframes: Array.from(new Set(clean.map(r => r.Timeframe).filter(Boolean)))
        });
      });
  }, []);

  const applyFilters = useCallback(() => {
    let data = [...trades];
    if (filters.search) {
      data = data.filter(row => JSON.stringify(row).toLowerCase().includes(filters.search.toLowerCase()));
    }
    if (filters.index) {
      data = data.filter(row => row.Index === filters.index);
    }
    if (filters.timeframe) {
      data = data.filter(row => row.Timeframe === filters.timeframe);
    }
    if (filters.signal) {
      data = data.filter(row => row.Signal === filters.signal);
    }
    if (filters.pnl === 'profit') {
      data = data.filter(row => parseFloat(row['Profit (INR)'] || 0) > 0);
    } else if (filters.pnl === 'loss') {
      data = data.filter(row => parseFloat(row['Profit (INR)'] || 0) <= 0);
    }
    setFiltered(data);
  }, [filters, trades]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const computeMetrics = (data) => {
    const totalTrades = data.length;
    const wins = data.filter(row => parseFloat(row['Profit (INR)'] || 0) > 0).length;
    const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(2) : 0;
    const averageROI = totalTrades ? (data.reduce((sum, r) => sum + parseFloat(r.ROI || 0), 0) / totalTrades).toFixed(2) : 0;
    const totalProfit = data.reduce((sum, r) => sum + parseFloat(r['Profit (INR)'] || 0), 0).toFixed(2);
    const avgDuration = totalTrades ? (data.reduce((sum, r) => sum + parseFloat(r['Trade Duration'] || 0), 0) / totalTrades).toFixed(2) : 0;
    const targetSuccess = {};
    ['T1Hit','T2Hit','T3Hit','T4Hit','T5Hit','T6Hit'].forEach(t => {
      const hit = data.filter(r => r[t]).length;
      targetSuccess[t] = totalTrades ? ((hit/totalTrades)*100).toFixed(2) : 0;
    });
    setMetrics({ totalTrades, winRate, averageROI, totalProfit, averageDuration: avgDuration, targetSuccess });
  };

  return (
    <div className="App">
      <h1>Trading Dashboard</h1>
      <Filters filters={filters} setFilters={setFilters} options={options} />
      <Summary metrics={metrics} />
      <Charts data={filtered} />
      <TradeTable data={filtered} onSelect={setSelected} />
      <TradeModal trade={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default App;

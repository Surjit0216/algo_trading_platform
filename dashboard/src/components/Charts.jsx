import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

function Charts({ data }) {
  if (!data || !data.length) return null;

  const dates = data.map(d => d.Date || d.date);
  const roiData = data.map(d => parseFloat(d.ROI || 0));
  const profitData = data.map(d => parseFloat(d['Profit (INR)'] || 0));

  const roiChart = {
    labels: dates,
    datasets: [{ label: 'ROI', data: roiData, borderColor: 'blue' }]
  };

  const profitChart = {
    labels: dates,
    datasets: [{ label: 'Profit', data: profitData, backgroundColor: 'green' }]
  };

  const winLoss = {
    labels: ['Win', 'Loss'],
    datasets: [{
      data: [data.filter(d => parseFloat(d['Profit (INR)'] || 0) > 0).length,
             data.filter(d => parseFloat(d['Profit (INR)'] || 0) <= 0).length],
      backgroundColor: ['#4caf50', '#f44336']
    }]
  };

  return (
    <div className="charts">
      <h3>ROI Over Time</h3>
      <Line data={roiChart} />
      <h3>Daily Profit</h3>
      <Bar data={profitChart} />
      <h3>Win/Loss</h3>
      <Pie data={winLoss} />
    </div>
  );
}

export default Charts;

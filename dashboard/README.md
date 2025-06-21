# 📊 Trading Dashboard

A modern, interactive dashboard for analyzing paper trading performance with real-time Google Sheets integration.

## 🚀 Features

### 📈 **Overview Dashboard**

- **Total Trades**: Complete count of all executed trades
- **Win Rate**: Percentage of profitable trades
- **Average ROI**: Mean return on investment per trade
- **Total Profit**: Net profit/loss in INR
- **Average Duration**: Mean trade duration in minutes
- **Profit Factor**: Win/loss ratio for strategy evaluation
- **Target Hit Analysis**: Success rate for each target (T1-T6)

### 🔍 **Advanced Filtering**

- **Search**: Global search across all trade data
- **Index Filter**: Filter by trading instrument (BTCUSDT, BANKNIFTY, etc.)
- **Timeframe Filter**: Filter by trading timeframe (5min, 15min, etc.)
- **Signal Filter**: Filter by Buy/Sell signals
- **PnL Filter**: Filter by profit/loss trades

### 📊 **Comprehensive Charts**

- **Daily Profit/Loss**: Bar chart showing daily performance
- **ROI Trend**: Line chart tracking ROI over time
- **Target Hit Distribution**: Bar chart showing target success rates
- **Win/Loss Ratio**: Doughnut chart of winning vs losing trades
- **Signal Performance**: Pie chart showing Buy vs Sell performance
- **Trade Volume by Day**: Bar chart of daily trade frequency

### 📋 **Interactive Trade Table**

- **Key Columns**: Date, Signal, Index, Strike, Timeframe, Profit, ROI, Status, Duration
- **Color Coding**: Profit/loss indicators with green/red colors
- **Click to View**: Click any trade for detailed modal view
- **Responsive Design**: Works on desktop and mobile

### 🔍 **Detailed Trade Modal**

- **Organized Sections**: Basic Info, Targets, Performance, Timing, Other
- **Target Analysis**: Shows all 6 targets with hit/miss status
- **Performance Metrics**: Profit, ROI, Volume, Duration
- **Timing Details**: Entry/Exit timestamps and duration

## 🛠️ Setup Instructions

### 1. **Clone and Install**

```bash
git clone <your-repo-url>
cd dashboard
npm install
```

### 2. **Google Sheets Configuration**

The dashboard automatically connects to your Google Sheet using the CSV export feature. Make sure your sheet:

1. **Has the correct structure** with these columns:

   - `Date`, `Signal`, `Strike`, `T1-T6`, `T1Hit-T6Hit`
   - `FinalTarget`, `Points`, `TimeTaken`, `Status`
   - `Tracking ID`, `Index`, `Timeframe`, `Volume`
   - `Profit (INR)`, `ROI`, `Entry Timestamp`, `Exit Timestamp`
   - `Trade Duration`

2. **Is publicly accessible** for CSV export:

   - Go to your Google Sheet
   - Click "Share" → "Change to anyone with the link" → "Viewer"
   - Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

3. **Update the Sheet ID** in `src/App.jsx`:
   ```javascript
   const SHEET_ID = "YOUR_ACTUAL_SHEET_ID";
   ```

### 3. **Run the Application**

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## 📱 **Responsive Design**

The dashboard is fully responsive and works on:

- **Desktop**: Full feature set with multi-column layouts
- **Tablet**: Optimized layouts with touch-friendly interactions
- **Mobile**: Single-column layout with mobile-optimized controls

## 🎨 **Modern UI Features**

- **Dark Theme**: Professional dark gradient background
- **Glass Morphism**: Translucent cards with backdrop blur
- **Smooth Animations**: Hover effects and transitions
- **Color Coding**: Intuitive green/red for profits/losses
- **Professional Typography**: Clean, readable fonts
- **Interactive Elements**: Hover states and click feedback

## 🔄 **Real-Time Data**

- **Auto-refresh**: Manual refresh button to get latest data
- **Error Handling**: Graceful error messages and retry options
- **Loading States**: Spinner and loading indicators
- **Data Validation**: Handles missing or malformed data

## 📊 **Data Analysis Features**

### **Performance Metrics**

- Win rate calculation
- Average ROI per trade
- Total profit/loss tracking
- Trade duration analysis
- Target hit success rates

### **Visual Analytics**

- Daily profit/loss trends
- ROI performance over time
- Target achievement patterns
- Signal effectiveness analysis
- Trading volume patterns

## 🚀 **Getting Started**

1. **Start the application**: `npm run dev`
2. **Configure your Google Sheet**: Update the Sheet ID
3. **View your data**: The dashboard will automatically load your trading data
4. **Explore features**: Use filters, view charts, and click trades for details

## 🔧 **Customization**

### **Adding New Charts**

The chart system is modular. Add new charts in `src/components/Charts.jsx`:

```javascript
const newChart = {
  labels: [...],
  datasets: [{
    label: 'New Metric',
    data: [...],
    backgroundColor: 'rgba(0, 212, 255, 0.6)'
  }]
};
```

### **Modifying Filters**

Add new filters in `src/components/Filters.jsx` and update the filter logic in `src/App.jsx`.

### **Styling**

All styles are in `src/App.css` with CSS custom properties for easy theming.

## 📈 **Trading Insights**

The dashboard helps you:

- **Identify profitable patterns** in your trading strategy
- **Track target achievement** rates for optimization
- **Analyze signal effectiveness** (Buy vs Sell performance)
- **Monitor daily performance** trends
- **Evaluate trade duration** impact on profitability

## 🤝 **Support**

For issues or questions:

1. Check the console for error messages
2. Verify your Google Sheet is publicly accessible
3. Ensure your sheet has the required column structure
4. Check that your data is properly formatted

---

**Happy Trading! 📈💰**

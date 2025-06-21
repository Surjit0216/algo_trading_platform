# 🔧 Google Sheets Setup Guide

## 📋 Prerequisites

1. **Google Account**: You need a Google account to create and manage Google Sheets
2. **Trading Data**: Your trading data should be in a Google Sheet with the required column structure

## 🚀 Step-by-Step Setup

### 1. **Prepare Your Google Sheet**

Your Google Sheet should have these columns (in any order):

```
Date, Signal, Index, Strike, Timeframe, T1, T1Hit, T2, T2Hit, T3, T3Hit, T4, T4Hit, T5, T5Hit, T6, T6Hit, FinalTarget, Points, TimeTaken, Status, Tracking ID, Volume, Profit (INR), ROI, Entry Timestamp, Exit Timestamp, Trade Duration
```

**Example Row:**

```
2024-01-15, Buy, BTCUSDT, 45000, 5min, 45100, true, 45200, true, 45300, false, 45400, false, 45500, false, 45600, false, 45200, 200, 15, Completed, TR001, 100, 1500, 3.33, 2024-01-15 09:30:00, 2024-01-15 09:45:00, 15
```

### 2. **Make Your Sheet Publicly Accessible**

1. **Open your Google Sheet**
2. **Click "Share"** (top right corner)
3. **Click "Change to anyone with the link"**
4. **Set permission to "Viewer"**
5. **Click "Done"**

### 3. **Get Your Sheet ID**

From your Google Sheet URL:

```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
```

Copy the `YOUR_SHEET_ID_HERE` part.

### 4. **Update the Dashboard**

1. **Open `src/App.jsx`**
2. **Find this line:**
   ```javascript
   const SHEET_ID = "1cwRV3AGiQmT_TkBwXozxAw_ezD1Yw4m5tsr-AJl3AKU";
   ```
3. **Replace with your Sheet ID:**
   ```javascript
   const SHEET_ID = "YOUR_ACTUAL_SHEET_ID";
   ```

### 5. **Test the Integration**

1. **Save the file**
2. **Refresh your browser** (or restart the dev server)
3. **Check the dashboard** - it should now load your data

## 🔍 Troubleshooting

### **"Error Loading Data" Message**

**Possible Causes:**

- Sheet is not publicly accessible
- Wrong Sheet ID
- Missing required columns
- Data format issues

**Solutions:**

1. **Check Sheet Permissions**: Ensure it's set to "Anyone with the link can view"
2. **Verify Sheet ID**: Double-check the ID in the URL
3. **Check Column Names**: Ensure all required columns exist
4. **Check Data Format**: Ensure dates and numbers are properly formatted

### **"Using Sample Data" Message**

This means the dashboard couldn't access your Google Sheet and is using sample data instead.

**To fix:**

1. Follow the setup steps above
2. Make sure your sheet is publicly accessible
3. Verify the Sheet ID is correct

### **Empty Dashboard**

**Possible Causes:**

- No data in the sheet
- Column names don't match
- Data format issues

**Solutions:**

1. **Add some test data** to your sheet
2. **Check column names** match exactly
3. **Verify data format** (dates, numbers, etc.)

## 📊 Data Format Requirements

### **Required Columns:**

| Column             | Type    | Example           | Description            |
| ------------------ | ------- | ----------------- | ---------------------- |
| `Date`             | Date    | `2024-01-15`      | Trade date             |
| `Signal`           | Text    | `Buy` or `Sell`   | Trade direction        |
| `Index`            | Text    | `BTCUSDT`         | Trading instrument     |
| `Strike`           | Number  | `45000`           | Entry price            |
| `Timeframe`        | Text    | `5min`            | Trading timeframe      |
| `T1` to `T6`       | Number  | `45100`           | Target prices          |
| `T1Hit` to `T6Hit` | Boolean | `true` or `false` | Target hit status      |
| `Profit (INR)`     | Number  | `1500`            | Profit/loss in INR     |
| `ROI`              | Number  | `3.33`            | Return on investment % |
| `Trade Duration`   | Number  | `15`              | Duration in minutes    |

### **Optional Columns:**

| Column            | Type     | Example               | Description      |
| ----------------- | -------- | --------------------- | ---------------- |
| `Status`          | Text     | `Completed`           | Trade status     |
| `Volume`          | Number   | `100`                 | Trading volume   |
| `Entry Timestamp` | DateTime | `2024-01-15 09:30:00` | Entry time       |
| `Exit Timestamp`  | DateTime | `2024-01-15 09:45:00` | Exit time        |
| `Tracking ID`     | Text     | `TR001`               | Trade identifier |

## 🔄 Real-Time Updates

The dashboard will automatically fetch the latest data when you:

- Click the "Refresh Data" button
- Reload the page

**Note:** The dashboard doesn't auto-refresh continuously. You need to manually refresh to see new data.

## 🛡️ Security Considerations

- **Public Access**: Making your sheet public means anyone with the link can view it
- **Sensitive Data**: Don't include personal information or account details
- **Read-Only**: The dashboard only reads data, it doesn't modify your sheet

## 📱 Mobile Access

The dashboard works on mobile devices, but for the best experience:

- Use landscape orientation on tablets
- Use desktop view on mobile browsers
- Ensure your sheet is accessible on mobile

## 🆘 Need Help?

If you're still having issues:

1. **Check the browser console** for error messages
2. **Verify your sheet structure** matches the requirements
3. **Test with sample data** first to ensure the dashboard works
4. **Check network connectivity** and firewall settings

---

**Happy Trading! 📈💰**

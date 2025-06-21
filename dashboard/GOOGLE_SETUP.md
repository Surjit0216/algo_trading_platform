# 🔐 Google Sheets API Setup Guide

This guide will help you set up Google Sheets API access to securely fetch data from your private Google Sheet.

## 📋 Prerequisites

1. **Google Account**: You need a Google account with access to Google Cloud Console
2. **Google Sheet**: Your trading data sheet (can remain private)
3. **Node.js**: For running the backend server

## 🚀 Step-by-Step Setup

### 1. **Enable Google Sheets API**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

### 2. **Create Service Account**

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in the details:
   - **Name**: `trading-dashboard-api`
   - **Description**: `Service account for trading dashboard`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. **Generate Service Account Key**

1. Click on your newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Choose "JSON" format
5. Click "Create"
6. **Download the JSON file** - this is your credentials file

### 4. **Share Your Google Sheet**

1. Open your Google Sheet
2. Click "Share" (top right)
3. Add your service account email (found in the JSON file under `client_email`)
4. Give it **Viewer** permissions
5. Click "Done"

### 5. **Set Up Credentials in Dashboard**

1. **Rename the downloaded JSON file** to `google-credentials.json`
2. **Place it in your project root** (same folder as `package.json`)
3. **Add it to .gitignore** to keep it secure:
   ```bash
   echo "google-credentials.json" >> .gitignore
   ```

### 6. **Install Dependencies**

```bash
npm install
```

### 7. **Start the Backend Server**

```bash
npm run server
```

### 8. **Start the Frontend**

In a new terminal:

```bash
npm run dev
```

## 🔧 Configuration

### **Environment Variables**

You can customize the setup by adding these to your `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# Google Sheets Configuration (optional - can be set in server.js)
SHEET_ID=your_sheet_id_here
PORT=3001
```

### **Update Sheet ID**

If you want to use a different Google Sheet, update the `SHEET_ID` in `server.js`:

```javascript
const SHEET_ID = "your_new_sheet_id_here";
```

## 🧪 Testing

### **Test the API**

1. **Health Check**: Visit `http://localhost:3001/api/health`
2. **Data Endpoint**: Visit `http://localhost:3001/api/sheet-data`

### **Test the Dashboard**

1. Open `http://localhost:5173`
2. The dashboard should load your real data
3. No more "Using Sample Data" message

## 🔍 Troubleshooting

### **"Google Sheets API not initialized"**

**Possible Causes:**

- Missing `google-credentials.json` file
- Invalid credentials file
- Wrong file path

**Solutions:**

1. Ensure `google-credentials.json` is in the project root
2. Verify the JSON file is valid
3. Check file permissions

### **"Failed to fetch data from Google Sheets"**

**Possible Causes:**

- Sheet not shared with service account
- Wrong Sheet ID
- API not enabled

**Solutions:**

1. Share the sheet with the service account email
2. Verify the Sheet ID in `server.js`
3. Ensure Google Sheets API is enabled

### **"Service account email not found"**

The service account email is in your `google-credentials.json` file under `client_email`. It looks like:

```
your-project@your-project.iam.gserviceaccount.com
```

### **CORS Errors**

The backend is configured to allow requests from `http://localhost:5173`. If you change the frontend port, update the CORS configuration in `server.js`.

## 🔒 Security Best Practices

1. **Never commit credentials**: The `google-credentials.json` file is in `.gitignore`
2. **Use environment variables**: For production, use environment variables instead of file
3. **Limit permissions**: Service account only needs "Viewer" access
4. **Regular rotation**: Rotate service account keys periodically

## 🚀 Production Deployment

For production deployment:

1. **Use environment variables** instead of file:

   ```javascript
   const auth = new google.auth.GoogleAuth({
     credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
     scopes: SCOPES,
   });
   ```

2. **Set up proper CORS** for your production domain

3. **Use HTTPS** for secure communication

4. **Set up monitoring** for API usage and errors

## 📊 API Endpoints

- `GET /api/health` - Health check
- `GET /api/sheet-data` - Fetch sheet data
- `GET /*` - Serve React app

## 🆘 Need Help?

If you encounter issues:

1. **Check the server logs** for detailed error messages
2. **Verify Google Cloud Console** settings
3. **Test the API endpoints** directly
4. **Check browser console** for frontend errors

---

**Happy Trading! 📈💰**

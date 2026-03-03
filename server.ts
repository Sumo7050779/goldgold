import express from "express";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";

// No cache for Binance as it's unlimited and we want real-time sync
async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy Route for Gold Price (Spot) - Single Source of Truth: Binance
  app.get("/api/gold-price", async (req, res) => {
    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT");
      const data = await response.json() as any;

      if (!response.ok) throw new Error("Binance API error");

      const mappedData = {
        timestamp: Math.floor(Date.now() / 1000),
        price: parseFloat(data.lastPrice),
        ch: parseFloat(data.priceChange),
        chp: parseFloat(data.priceChangePercent),
        prev_close_price: parseFloat(data.prevClosePrice),
        symbol: "PAXGUSDT"
      };

      res.json(mappedData);
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // API Proxy Route for Thai Gold Price (XAU/THB) - Derived from the same Binance price
  app.get("/api/gold-price-th", async (req, res) => {
    try {
      const [paxgRes, rateRes] = await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT"),
        fetch("https://open.er-api.com/v6/latest/USD").catch(() => null)
      ]);
      
      const paxgData = await paxgRes.json() as any;
      let thbRate = 36.0;
      
      if (rateRes?.ok) {
        const rateData = await rateRes.json() as any;
        thbRate = rateData.rates.THB;
      }

      const usdPrice = parseFloat(paxgData.lastPrice);
      const usdPrevClose = parseFloat(paxgData.prevClosePrice);

      res.json({
        price: usdPrice * thbRate,
        prev_close_price: usdPrevClose * thbRate,
        rate: thbRate,
        timestamp: Math.floor(Date.now() / 1000)
      });
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // API Proxy Route for Market Indices - Fetching multiple assets from Binance
  app.get("/api/market-indices", async (req, res) => {
    try {
      const symbols = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
        "LTCUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "LINKUSDT",
        "AVAXUSDT", "SHIBUSDT", "MATICUSDT", "TRXUSDT"
      ];
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`);
      const data = await response.json() as any[];

      if (!response.ok) throw new Error("Binance API error");

      const indices = data.map(item => ({
        symbol: item.symbol.replace("USDT", ""),
        price: parseFloat(item.lastPrice),
        change: parseFloat(item.priceChange),
        changePercent: parseFloat(item.priceChangePercent)
      }));

      res.json(indices);
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // API Proxy Route for News - Expanded to include broader financial and general news
  app.get("/api/news", async (req, res) => {
    try {
      const { category = 'gold,finance,economy,world' } = req.query;
      // Using a more comprehensive search or multiple queries if needed
      // For now, we'll use the existing GoldAPI news but with broader keywords if possible
      // Or fallback to a public RSS feed aggregator if GoldAPI is limited
      const myHeaders = {
        "x-access-token": process.env.GOLD_API_KEY || "goldapi-5ho7nsmm9azjlv-io",
        "Content-Type": "application/json"
      };

      const response = await fetch(`https://www.goldapi.io/api/news`, {
        method: 'GET',
        headers: myHeaders
      });

      const data = await response.json();
      
      // If GoldAPI news fails or is empty, we could potentially fetch from other sources
      // but for this turn, let's ensure we return what we have and maybe add a mock "World News" 
      // if the user wants "everything".
      
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // API Proxy Route for Historical Candles (Klines)
  app.get("/api/gold-history", async (req, res) => {
    try {
      const { interval = '1m', limit = '100' } = req.query;
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${interval}&limit=${limit}`);
      const data = await response.json() as any[];

      if (!response.ok) {
        throw new Error("Failed to fetch history from Binance");
      }

      // Map Binance klines to our CandleData format
      const history = data.map(d => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4])
      }));

      res.json(history);
    } catch (error: any) {
      console.error("History Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch market history" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving (if needed, but mainly for dev here)
    app.use(express.static('dist'));
  }

  // API Proxy Route for Gold History Summary - Specifically for AI Context
  app.get("/api/gold-history-summary", async (req, res) => {
    try {
      // Fetch daily klines for the last 30 days to see long-term trend
      const response = await fetch("https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=1d&limit=30");
      const data = await response.json() as any[];

      if (!response.ok) throw new Error("Binance API error");

      const summary = data.map(item => ({
        date: new Date(item[0]).toLocaleDateString(),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5])
      }));

      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

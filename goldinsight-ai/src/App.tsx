import { useState, useEffect, useCallback } from 'react';
import { GoldChart } from './components/GoldChart';
import { TradingViewChart } from './components/TradingViewChart';
import { ThaiGoldChart } from './components/ThaiGoldChart';
import { TradingViewAnalysis } from './components/TradingViewAnalysis';
import { MarketStats } from './components/MarketStats';
import { AnalysisPanel } from './components/AnalysisPanel';
import { NewsFeed } from './components/NewsFeed';
import { geminiService, MarketAnalysis, NewsItem } from './services/gemini';
import { goldApiService, GoldPriceData } from './services/goldApi';
import { LayoutDashboard, Newspaper, Settings, Bell, Menu, X, RefreshCw, GraduationCap, BookOpen, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// Types
interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const INTERVAL_MAP: Record<string, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  'D': 24 * 60 * 60 * 1000,
};

const MarketTicker = ({ indices }: { indices: any[] }) => {
  if (!indices || indices.length === 0) return null;
  
  return (
    <div className="w-full bg-black/40 border-b border-white/5 py-1.5 overflow-hidden whitespace-nowrap relative z-40">
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex items-center gap-8 whitespace-nowrap"
        style={{ width: 'fit-content' }}
      >
        {[...indices, ...indices, ...indices].map((index, i) => (
          <div key={i} className="flex items-center gap-2 px-4 border-r border-white/10 last:border-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{index.symbol}</span>
            <span className="text-xs font-mono font-bold text-white">
              {index.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] font-mono ${index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

function App() {
  // State
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [thaiPrice, setThaiPrice] = useState<number>(0);
  const [candleHistory, setCandleHistory] = useState<CandleData[]>([]);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [thaiPriceChange, setThaiPriceChange] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'learn'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [marketIndices, setMarketIndices] = useState<any[]>([]);
  const [timeInterval, setTimeInterval] = useState('1m');
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'custom' | 'tradingview' | 'thai'>('tradingview');
  
  // AI Data State
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [historySummary, setHistorySummary] = useState<any[]>([]);
  const [masterclass, setMasterclass] = useState<string>('');
  const [isMasterclassLoading, setIsMasterclassLoading] = useState(false);

  // Generate Mock History for a full chart look
  const generateHistory = useCallback((interval: string, basePrice: number) => {
    const duration = INTERVAL_MAP[interval];
    const now = Math.floor(Date.now() / duration) * duration;
    const history: CandleData[] = [];
    let current = basePrice;

    // Increase to 60 candles for a more complete initial view
    for (let i = 60; i >= 0; i--) {
      const time = now - i * duration;
      const open = current + (Math.random() - 0.5) * 5;
      const close = open + (Math.random() - 0.5) * 4;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      
      history.push({ time, open, high, low, close });
      current = close;
    }
    return history;
  }, []);

  // Fetch Gold Price
  const fetchGoldPrice = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsLoadingPrice(true);
    try {
      const [spotData, thaiData] = await Promise.all([
        goldApiService.fetchPrice(),
        goldApiService.fetchThaiPrice()
      ]);
      
      // Spot Price
      setCurrentPrice(spotData.price);
      setPriceChange(spotData.ch);
      setPriceChangePercent(spotData.chp);
      setLastUpdated(new Date(spotData.timestamp * 1000));
      
      // Calculate Thai Gold Price (96.5%)
      // Formula: ((Price per Troy Ounce in THB / 31.1035) * 15.244 * 0.965) + Premium
      // 15.244 is the weight of 1 Baht of gold in grams
      // 0.965 is the purity
      const THAI_GOLD_MULTIPLIER = (15.244 * 0.965) / 31.1034768; // approx 0.4729
      const ASSOCIATION_PREMIUM = 100; // Standard association premium
      
      const calculatedThaiPrice = (thaiData.price * THAI_GOLD_MULTIPLIER) + ASSOCIATION_PREMIUM;
      const prevThaiPrice = (thaiData.prev_close_price * THAI_GOLD_MULTIPLIER) + ASSOCIATION_PREMIUM;
      
      // Round to nearest 50 (Thai gold standard)
      const roundedThaiPrice = Math.round(calculatedThaiPrice / 50) * 50;
      setThaiPrice(roundedThaiPrice);
      
      // Calculate change based on rounded prices for better user perception
      const roundedPrevThaiPrice = Math.round(prevThaiPrice / 50) * 50;
      setThaiPriceChange(roundedThaiPrice - roundedPrevThaiPrice);
      
      setError(null);

      // If initial, fetch full history from Binance
      if (isInitial || candleHistory.length === 0) {
        const history = await goldApiService.fetchHistory(timeInterval, 100);
        setCandleHistory(history);
      } else {
        // Update the last candle or add a new one
        setCandleHistory(prev => {
          const lastCandle = prev[prev.length - 1];
          const duration = INTERVAL_MAP[timeInterval];
          const bucketTime = Math.floor(Date.now() / duration) * duration;

          if (lastCandle && lastCandle.time === bucketTime) {
            const updatedCandle = {
              ...lastCandle,
              high: Math.max(lastCandle.high, spotData.price),
              low: Math.min(lastCandle.low, spotData.price),
              close: spotData.price
            };
            return [...prev.slice(0, -1), updatedCandle];
          } else {
            const newCandle: CandleData = {
              time: bucketTime,
              open: lastCandle ? lastCandle.close : spotData.price,
              high: spotData.price,
              low: spotData.price,
              close: spotData.price
            };
            const newHistory = [...prev, newCandle];
            if (newHistory.length > 200) newHistory.shift();
            return newHistory;
          }
        });
      }

    } catch (error: any) {
      console.error("Failed to fetch gold price", error);
      if (isInitial) {
        setError(error.message || "ไม่สามารถโหลดข้อมูลราคาได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
      }
    } finally {
      if (!isInitial) setIsLoadingPrice(false);
    }
  }, [timeInterval, generateHistory, candleHistory.length]);

  // Effect to refetch history when interval changes
  useEffect(() => {
    const updateHistory = async () => {
      setIsLoadingPrice(true);
      try {
        const history = await goldApiService.fetchHistory(timeInterval, 100);
        setCandleHistory(history);
      } catch (err) {
        console.error("Failed to update history on interval change", err);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    if (candleHistory.length > 0) {
      updateHistory();
    }
  }, [timeInterval]);

  const handleRefreshNews = useCallback(async () => {
    setIsNewsLoading(true);
    try {
      const result = await geminiService.getGlobalNews();
      setNews(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsNewsLoading(false);
    }
  }, []);

  const fetchMarketIndices = useCallback(async () => {
    const data = await goldApiService.fetchMarketIndices();
    setMarketIndices(data);
  }, []);

  const fetchHistorySummary = useCallback(async () => {
    const data = await goldApiService.fetchHistorySummary();
    setHistorySummary(data);
    return data;
  }, []);

  const fetchMasterclass = useCallback(async (summary: any[]) => {
    setIsMasterclassLoading(true);
    try {
      const content = await geminiService.getMasterclassContent(summary);
      setMasterclass(content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMasterclassLoading(false);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    const init = async () => {
      setIsLoadingPrice(true);
      setIsNewsLoading(true);
      try {
        const [,, summary] = await Promise.all([
          fetchGoldPrice(true),
          handleRefreshNews(),
          fetchHistorySummary(),
          fetchMarketIndices()
        ]);
        if (summary) {
           fetchMasterclass(summary);
        }
      } catch (err) {
        console.error("Initial load failed", err);
      } finally {
        setIsLoadingPrice(false);
        setIsNewsLoading(false);
      }
    };
    init();
  }, []); // Run only once on mount

  // Background price update
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGoldPrice(false);
      fetchMarketIndices();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchGoldPrice, fetchMarketIndices]);

  // Handle interval change separately
  useEffect(() => {
    if (currentPrice > 0) {
      setCandleHistory(generateHistory(timeInterval, currentPrice));
    }
  }, [timeInterval, generateHistory, currentPrice]);

  // Handlers
  const handleAnalyze = async () => {
    if (currentPrice === 0) return;
    
    setIsAnalyzing(true);
    const rsi = 50 + (priceChangePercent * 10); 
    
    try {
      const result = await geminiService.analyzeMarket(
        currentPrice, 
        priceChangePercent, 
        Math.round(rsi), 
        news,
        marketIndices,
        historySummary
      );
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white font-sans overflow-hidden flex">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-[#141519]">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <span className="font-bold text-black">G</span>
          </div>
          <h1 className="font-bold text-xl tracking-tight">GoldInsight AI</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('news')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'news' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
          >
            <Newspaper size={20} />
            <span>ข่าวสาร & บทวิเคราะห์</span>
          </button>
          <button 
            onClick={() => setActiveTab('learn')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'learn' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
          >
            <GraduationCap size={20} />
            <span>ศูนย์การเรียนรู้</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-purple-300 mb-1">AI Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium">Gemini 3.0 Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#141519] z-50 md:hidden border-r border-white/10"
            >
              <div className="p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
                    <span className="font-bold text-black">G</span>
                  </div>
                  <h1 className="font-bold text-xl">GoldInsight</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <nav className="px-4 space-y-2 mt-4">
                <button 
                  onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('news'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === 'news' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                >
                  <Newspaper size={20} />
                  <span>ข่าวสาร</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('learn'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === 'learn' ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                >
                  <GraduationCap size={20} />
                  <span>เรียนรู้</span>
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Market Ticker */}
        <MarketTicker indices={marketIndices} />
        
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/10 rounded-lg">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-medium text-gray-200">
              {activeTab === 'dashboard' ? 'Market Overview' : 'Global News & Analysis'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
              <div className="flex flex-col items-end border-r border-white/10 pr-4">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Gold Spot</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${currentPrice.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-mono ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {priceChange >= 0 ? '▲' : '▼'}{Math.abs(priceChange).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Thai Gold (96.5%)</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono font-bold ${thaiPriceChange >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    ฿{thaiPrice.toLocaleString()}
                  </span>
                  <span className={`text-[10px] font-mono ${thaiPriceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {thaiPriceChange >= 0 ? '+' : ''}{thaiPriceChange}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => fetchGoldPrice()}
              disabled={isLoadingPrice}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Refresh Price"
            >
              <RefreshCw size={20} className={`text-gray-400 ${isLoadingPrice ? 'animate-spin' : ''}`} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 border border-white/10"></div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setChartType('tradingview')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${chartType === 'tradingview' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-white'}`}
                      >
                        TradingView (Real-time)
                      </button>
                      <button 
                        onClick={() => setChartType('custom')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${chartType === 'custom' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-white'}`}
                      >
                        Custom Chart
                      </button>
                      <button 
                        onClick={() => setChartType('thai')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${chartType === 'thai' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-white'}`}
                      >
                        Thai Gold (96.5%)
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest hidden sm:block">
                      Market View
                    </div>
                  </div>

                  {chartType === 'tradingview' ? (
                    <TradingViewChart symbol="OANDA:XAUUSD" interval="1" />
                  ) : chartType === 'thai' ? (
                    <ThaiGoldChart />
                  ) : error ? (
                    <div className="w-full h-[400px] bg-[#1a1b1e] rounded-xl p-8 border border-red-500/20 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <Info size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
                        <p className="text-gray-400 max-w-md">{error}</p>
                      </div>
                      <button 
                        onClick={() => fetchGoldPrice(true)}
                        className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw size={18} />
                        ลองใหม่อีกครั้ง
                      </button>
                    </div>
                  ) : candleHistory.length > 0 ? (
                    <GoldChart 
                      data={candleHistory} 
                      activeInterval={timeInterval}
                      onIntervalChange={setTimeInterval}
                    />
                  ) : (
                    <div className="w-full h-[400px] bg-[#1a1b1e] rounded-xl p-4 border border-white/10 shadow-lg flex items-center justify-center">
                      <div className="text-gray-500 flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin" />
                        <p>Loading market data...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Market Statistics</h4>
                      <MarketStats data={candleHistory} />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Quick Info</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#1a1b1e] p-4 rounded-xl border border-white/5">
                          <p className="text-gray-500 text-xs mb-1">Last Update</p>
                          <p className="text-white font-mono font-medium text-sm">
                            {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}
                          </p>
                        </div>
                        <div className="bg-[#1a1b1e] p-4 rounded-xl border border-white/5">
                          <p className="text-gray-500 text-xs mb-1">Change ($)</p>
                          <p className={`font-mono font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-[#1a1b1e] p-4 rounded-xl border border-white/5">
                          <p className="text-gray-500 text-xs mb-1">Change (%)</p>
                          <p className={`font-mono font-medium ${priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                          </p>
                        </div>
                        <div className="bg-[#1a1b1e] p-4 rounded-xl border border-white/5">
                          <p className="text-gray-500 text-xs mb-1">Status</p>
                          <p className="text-green-400 font-mono font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Live
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* News Preview (Mobile/Tablet only or bottom section) */}
                  <div className="block lg:hidden">
                    <NewsFeed news={news} isLoading={isNewsLoading} onRefresh={handleRefreshNews} />
                  </div>
                </div>

                {/* Right Column: AI Analysis & News */}
                <div className="space-y-6">
                  <TradingViewAnalysis symbol="OANDA:XAUUSD" />
                  
                  <AnalysisPanel 
                    analysis={analysis} 
                    isLoading={isAnalyzing} 
                    onAnalyze={handleAnalyze} 
                  />
                  <div className="hidden lg:block h-[400px]">
                     <NewsFeed news={news} isLoading={isNewsLoading} onRefresh={handleRefreshNews} />
                  </div>
                </div>
              </div>
            )}

            {/* News View */}
            {activeTab === 'news' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2">
                  <NewsFeed news={news} isLoading={isNewsLoading} onRefresh={handleRefreshNews} />
                </div>
                <div className="space-y-6">
                  <div className="bg-[#1a1b1e] p-6 rounded-xl border border-white/10">
                    <h3 className="text-white font-medium mb-4">Market Sentiment</h3>
                    <div className="flex items-center justify-center py-8">
                       <div className="relative w-48 h-24 overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-500 via-gray-500 to-green-500 opacity-20 rounded-t-full"></div>
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-24 bg-white origin-bottom transform -rotate-12 transition-transform duration-1000"></div>
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full"></div>
                       </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Bearish</span>
                      <span>Neutral</span>
                      <span>Bullish</span>
                    </div>
                  </div>
                  
                  <AnalysisPanel 
                    analysis={analysis} 
                    isLoading={isAnalyzing} 
                    onAnalyze={handleAnalyze} 
                  />
                </div>
              </div>
            )}

            {/* Learn View */}
            {activeTab === 'learn' && (
              <div className="max-w-5xl mx-auto space-y-12 pb-20">
                <div className="text-center space-y-4">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
                  >
                    AI Masterclass: เรียนรู้ทองคำจากข้อมูลจริง
                  </motion.h2>
                  <p className="text-gray-400 text-lg">เจาะลึกกลยุทธ์การวิเคราะห์โดย AI ที่เรียนรู้จากประวัติราคาล่าสุด</p>
                </div>

                {/* AI Masterclass Section */}
                <section className="bg-[#1a1b1e] p-8 rounded-3xl border border-yellow-500/20 shadow-2xl shadow-yellow-500/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black">
                      <GraduationCap size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">บทเรียนประจำวันนี้</h3>
                  </div>
                  
                  {isMasterclassLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <RefreshCw className="animate-spin text-yellow-500" size={32} />
                      <p className="text-gray-400">AI กำลังวิเคราะห์ประวัติราคาเพื่อสร้างบทเรียน...</p>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                       <div className="markdown-body">
                          <Markdown>{masterclass}</Markdown>
                       </div>
                    </div>
                  )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-2">ข้อมูลที่ AI ใช้เรียนรู้</h4>
                      <p className="text-sm text-gray-400">ประวัติราคาย้อนหลัง 30 วัน, ดัชนีตลาดโลก, และข่าวสารเศรษฐกิจมหภาค</p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-2">เป้าหมายการเรียนรู้</h4>
                      <p className="text-sm text-gray-400">เพื่อให้ผู้ใช้สามารถวิเคราะห์แนวโน้มได้ด้วยตัวเองอย่างแม่นยำที่สุด</p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-2">อัปเดตทุกวัน</h4>
                      <p className="text-sm text-gray-400">บทเรียนจะเปลี่ยนไปตามสถานการณ์ตลาดที่เกิดขึ้นจริงในแต่ละวัน</p>
                   </div>
                </div>

                {/* Original Learning Content */}
                <div className="pt-12 border-t border-white/5 space-y-12">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white">พื้นฐานการวิเคราะห์ทองคำ</h3>
                    <p className="text-gray-400">ความรู้เบื้องต้นที่คุณต้องทราบ</p>
                  </div>

                  {/* Technical Analysis Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-2xl font-bold text-white border-l-4 border-blue-500 pl-4">
                    <BookOpen className="text-blue-500" />
                    <h3>1. การวิเคราะห์ทางเทคนิค (Technical Analysis)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1a1b1e] p-6 rounded-2xl border border-white/5 space-y-4">
                      <h4 className="text-lg font-bold text-blue-400">รูปแบบกราฟ (Chart Patterns)</h4>
                      <ul className="space-y-3 text-gray-300 text-sm">
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span><strong>Head & Shoulders:</strong> สัญญาณกลับตัวจากขาขึ้นเป็นขาลง</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span><strong>Double Top/Bottom:</strong> ชี้ถึงแนวต้าน/แนวรับที่แข็งแกร่งและโอกาสกลับตัว</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span><strong>Triangle:</strong> ช่วงสะสมพลังก่อนการ Breakout ของราคา</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-[#1a1b1e] p-6 rounded-2xl border border-white/5 space-y-4">
                      <h4 className="text-lg font-bold text-blue-400">อินดิเคเตอร์ยอดนิยม (Indicators)</h4>
                      <ul className="space-y-3 text-gray-300 text-sm">
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span><strong>RSI:</strong> วัดภาวะซื้อมากเกินไป (&gt;70) หรือขายมากเกินไป (&lt;30)</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span><strong>MACD:</strong> ดูแรงขับเคลื่อน (Momentum) และการตัดกันของเส้นสัญญาณ</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span><strong>Bollinger Bands:</strong> บ่งชี้ความผันผวนและขอบเขตการเคลื่อนที่ของราคา</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Fundamental Analysis Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-2xl font-bold text-white border-l-4 border-yellow-500 pl-4">
                    <Info className="text-yellow-500" />
                    <h3>2. การวิเคราะห์ปัจจัยพื้นฐาน (Fundamental Analysis)</h3>
                  </div>
                  <div className="bg-[#1a1b1e] p-8 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                      <div className="space-y-4">
                        <h4 className="font-bold text-yellow-500 text-base">เศรษฐกิจมหภาค</h4>
                        <p className="text-gray-300 leading-relaxed">
                          ทองคำเป็นสินทรัพย์ <strong>Safe-haven</strong> ราคาจะพุ่งสูงขึ้นเมื่อเศรษฐกิจโลกชะลอตัวหรือเงินเฟ้อสูง 
                          นักลงทุนใช้ทองคำเพื่อรักษากำลังซื้อ (Hedge)
                        </p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-yellow-500 text-base">อัตราดอกเบี้ย & USD</h4>
                        <p className="text-gray-300 leading-relaxed">
                          ราคาทองคำมัก <strong>ผกผันกับค่าเงินดอลลาร์</strong> และอัตราดอกเบี้ย 
                          เมื่อดอกเบี้ยขึ้น ทองคำจะถูกกดดัน แต่ถ้าดอกเบี้ยลด ทองคำจะได้รับความนิยม
                        </p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-yellow-500 text-base">อุปสงค์ & อุปทาน</h4>
                        <p className="text-gray-300 leading-relaxed">
                          การสะสมทองคำของ <strong>ธนาคารกลางทั่วโลก</strong> และความต้องการในอุตสาหกรรมเครื่องประดับ 
                          (โดยเฉพาะจีนและอินเดีย) เป็นปัจจัยหลักที่หนุนราคาในระยะยาว
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* News Analysis Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-2xl font-bold text-white border-l-4 border-red-500 pl-4">
                    <Newspaper className="text-red-500" />
                    <h3>3. การวิเคราะห์ข่าวสาร (News Analysis)</h3>
                  </div>
                  <div className="bg-gradient-to-br from-[#1a1b1e] to-[#141517] p-8 rounded-2xl border border-white/5 space-y-6">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      ข่าวสารที่สร้างความไม่แน่นอนทางเศรษฐกิจหรือการเมือง มักทำให้ทองคำเป็นที่ต้องการ:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <h4 className="font-bold text-red-400 mb-2">ความเสี่ยงด้านภูมิรัฐศาสตร์</h4>
                        <p className="text-gray-400">สงคราม ความขัดแย้งระหว่างประเทศ หรือความตึงเครียดทางการเมือง หนุนราคาทองคำอย่างรุนแรง</p>
                      </div>
                      <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                        <h4 className="font-bold text-blue-400 mb-2">นโยบายการเงิน</h4>
                        <p className="text-gray-400">การประกาศตัวเลข CPI (เงินเฟ้อ) หรือการประชุม Fed ที่ส่งสัญญาณลดดอกเบี้ย มักเป็นบวกต่อทองคำ</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="text-center p-8 bg-yellow-500/5 rounded-3xl border border-yellow-500/10">
                  <p className="text-yellow-500/80 italic text-sm">
                    "การวิเคราะห์ราคาทองคำที่มีประสิทธิภาพ ต้องใช้ทั้งสัญญาณทางเทคนิคบนกราฟ ควบคู่ไปกับปัจจัยพื้นฐานและข่าวสารรอบด้าน"
                  </p>
                </div>
              </div>
            </div>
          )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import React, { useEffect, useRef } from 'react';

interface TradingViewAnalysisProps {
  symbol?: string;
  theme?: 'light' | 'dark';
}

export const TradingViewAnalysis: React.FC<TradingViewAnalysisProps> = ({ 
  symbol = "OANDA:XAUUSD", 
  theme = "dark" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = 'tradingview-analysis-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const createWidget = () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''; // Clear previous
        const widgetScript = document.createElement('script');
        widgetScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
        widgetScript.async = true;
        widgetScript.innerHTML = JSON.stringify({
          "interval": "1m",
          "width": "100%",
          "isTransparent": true,
          "height": "450",
          "symbol": symbol,
          "showIntervalTabs": true,
          "locale": "th",
          "colorTheme": theme
        });
        containerRef.current.appendChild(widgetScript);
      }
    };

    createWidget();
  }, [symbol, theme]);

  return (
    <div className="w-full bg-[#1a1b1e] rounded-xl border border-white/10 shadow-lg overflow-hidden p-4">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        TradingView Technical Analysis
      </h3>
      <div ref={containerRef} className="tradingview-widget-container__widget"></div>
      <div className="mt-4 text-[10px] text-gray-500 text-center uppercase tracking-widest">
        Powered by TradingView Engine
      </div>
    </div>
  );
};

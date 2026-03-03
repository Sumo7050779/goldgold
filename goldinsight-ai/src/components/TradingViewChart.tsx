import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  symbol = "OANDA:XAUUSD", 
  interval = "1", 
  theme = "dark" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const createWidget = () => {
      if (containerRef.current && window.TradingView) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": symbol,
          "interval": interval,
          "timezone": "Asia/Bangkok",
          "theme": theme,
          "style": "1",
          "locale": "th",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": "tradingview_gold_chart",
          "studies": [
            "RSI@tv-basicstudies",
            "MASimple@tv-basicstudies"
          ],
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    } else {
      if (window.TradingView) {
        createWidget();
      } else {
        script.onload = createWidget;
      }
    }

    return () => {
      // Cleanup if needed, though TradingView widget usually handles itself
    };
  }, [symbol, interval, theme]);

  return (
    <div className="w-full h-[600px] bg-[#131722] rounded-xl border border-[#2a2e39] shadow-2xl overflow-hidden">
      <div id="tradingview_gold_chart" ref={containerRef} className="w-full h-full" />
    </div>
  );
};

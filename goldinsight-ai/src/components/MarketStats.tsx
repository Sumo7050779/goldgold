import React from 'react';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface MarketStatsProps {
  data: {
    open: number;
    high: number;
    low: number;
    close: number;
    time: number;
  }[];
}

export const MarketStats: React.FC<MarketStatsProps> = ({ data }) => {
  if (data.length < 2) return null;

  const current = data[data.length - 1];
  const prev = data[data.length - 2];
  const change = current.close - prev.close;
  const changePercent = (change / prev.close) * 100;

  // Calculate simple volatility (High - Low range)
  const volatility = current.high - current.low;
  
  // Calculate simple Pivot Point
  const pivot = (current.high + current.low + current.close) / 3;
  const r1 = (2 * pivot) - current.low;
  const s1 = (2 * pivot) - current.high;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
          <Activity size={14} />
          <span>Volatility (Range)</span>
        </div>
        <div className="text-lg font-mono font-bold text-white">
          ${volatility.toFixed(2)}
        </div>
      </div>

      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
          <Target size={14} />
          <span>Pivot Point</span>
        </div>
        <div className="text-lg font-mono font-bold text-yellow-500">
          ${pivot.toFixed(2)}
        </div>
      </div>

      <div className="bg-white/5 p-4 rounded-xl border border-white/10 col-span-2">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-400">Support & Resistance (S1 / R1)</span>
          <div className={`flex items-center gap-1 text-[10px] ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {changePercent.toFixed(2)}%
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500/50" 
                style={{ width: '40%' }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-red-400">S1: ${s1.toFixed(2)}</span>
              <span className="text-[10px] text-green-400">R1: ${r1.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface GoldChartProps {
  data: CandleData[];
  activeInterval: string;
  onIntervalChange: (interval: string) => void;
}

const CustomCandlestick = (props: any) => {
  const { x, width, payload, yAxis } = props;
  if (!payload || !yAxis) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#089981' : '#f23645';
  
  // Calculate center X for the wick
  const centerX = x + width / 2;
  
  // Convert all prices to Y coordinates using the chart's scale
  const yHigh = yAxis.scale(high);
  const yLow = yAxis.scale(low);
  const yOpen = yAxis.scale(open);
  const yClose = yAxis.scale(close);
  
  // Body dimensions
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1); // Ensure at least 1px for flat candles
  
  return (
    <g>
      {/* 1. The Wick (Shadow): A single vertical line from High to Low through the center */}
      <line
        x1={centerX}
        y1={yHigh}
        x2={centerX}
        y2={yLow}
        stroke={color}
        strokeWidth={1}
      />
      {/* 2. The Body: A rectangle from Open to Close */}
      <rect
        x={x}
        y={bodyTop}
        width={width}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  );
};

// Helper to calculate EMA
const calculateEMA = (data: CandleData[], period: number) => {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  let ema = data[0].close;
  return data.map((d, i) => {
    if (i === 0) return { ...d, ema: d.close };
    ema = d.close * k + ema * (1 - k);
    return { ...d, ema };
  });
};

export const GoldChart: React.FC<GoldChartProps> = ({ data, activeInterval, onIntervalChange }) => {
  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  
  // Add 15% padding to the top and bottom of the chart
  const range = maxPrice - minPrice;
  const padding = range * 0.15 || 2;
  const domain = [minPrice - padding, maxPrice + padding];

  // Calculate EMA 20
  const dataWithEMA = calculateEMA(data, 20);

  // Prepare data for Recharts
  const chartData = dataWithEMA.map(d => ({
    ...d,
    body: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
    wick: [d.low, d.high],
    color: d.close >= d.open ? '#089981' : '#f23645',
    volume: Math.random() * 100 + 50 // Mock volume for visual effect
  }));

  return (
    <div className="w-full h-[500px] bg-[#131722] rounded-xl p-4 border border-[#2a2e39] shadow-2xl relative overflow-hidden">
      {/* TradingView-like Header */}
      <div className="flex justify-between items-center mb-6 border-b border-[#2a2e39] pb-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h3 className="text-[#d1d4dc] font-bold text-lg flex items-center gap-2">
              GOLD / U.S. DOLLAR
              <span className="text-xs font-normal text-[#787b86] bg-[#2a2e39] px-2 py-0.5 rounded">XAUUSD</span>
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-white">
                {data.length > 0 ? data[data.length - 1].close.toFixed(2) : '0.00'}
              </span>
              <span className={`text-sm font-medium ${data.length > 1 && data[data.length-1].close >= data[data.length-1].open ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {data.length > 1 ? (data[data.length-1].close - data[data.length-1].open).toFixed(2) : '0.00'} 
                ({data.length > 1 ? ((data[data.length-1].close - data[data.length-1].open) / data[data.length-1].open * 100).toFixed(2) : '0.00'}%)
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://th.tradingview.com/chart/ZRDPtP8r/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#2962ff] hover:underline"
          >
            TradingView <ExternalLink size={12} />
          </a>
          <div className="flex gap-1 bg-[#2a2e39] p-1 rounded">
            {['1m', '5m', '15m', '1h', '4h', 'D'].map(tf => (
              <button 
                key={tf} 
                onClick={() => onIntervalChange(tf)}
                className={`px-3 py-1 text-xs rounded transition-colors ${activeInterval === tf ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:bg-[#363a45]'}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 top-24 pointer-events-none opacity-5">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#2a2e39 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <ComposedChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="0" stroke="#2a2e39" vertical={true} horizontal={true} />
          <XAxis 
            dataKey="time" 
            tickFormatter={(time) => {
              if (activeInterval === 'D') return format(time, 'MMM dd');
              if (activeInterval === '1h' || activeInterval === '4h') return format(time, 'dd HH:mm');
              return format(time, 'HH:mm');
            }}
            stroke="#787b86"
            tick={{ fontSize: 10 }}
            tickMargin={12}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis 
            domain={domain} 
            stroke="#787b86"
            tick={{ fontSize: 11 }}
            tickFormatter={(val) => val.toFixed(2)}
            orientation="right"
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="volume"
            orientation="left"
            hide={true}
            domain={[0, (data: any) => Math.max(...chartData.map(d => d.volume)) * 4]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e222d', border: '1px solid #2a2e39', borderRadius: '4px', color: '#d1d4dc' }}
            itemStyle={{ color: '#2962ff' }}
            labelFormatter={(label) => format(label, 'HH:mm:ss')}
            cursor={{ stroke: '#787b86', strokeWidth: 1, strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-[#1e222d] border border-[#2a2e39] p-3 rounded shadow-xl text-xs space-y-1">
                    <p className="text-[#787b86] mb-2">{format(d.time, 'MMM dd, HH:mm:ss')}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-[#787b86]">Open:</span> <span className="text-white font-mono">{d.open.toFixed(2)}</span>
                      <span className="text-[#787b86]">High:</span> <span className="text-white font-mono">{d.high.toFixed(2)}</span>
                      <span className="text-[#787b86]">Low:</span> <span className="text-white font-mono">{d.low.toFixed(2)}</span>
                      <span className="text-[#787b86]">Close:</span> <span className="text-white font-mono">{d.close.toFixed(2)}</span>
                      {d.ema && (
                        <>
                          <span className="text-[#2962ff]">EMA 20:</span> <span className="text-white font-mono">{d.ema.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          
          {/* Volume Bars */}
          <Bar dataKey="volume" yAxisId="volume" barSize={10} opacity={0.1}>
            {chartData.map((entry, index) => (
              <Cell key={`vol-${index}`} fill={entry.color} />
            ))}
          </Bar>

          {/* Candlestick Chart */}
          <Bar 
            dataKey="body" 
            shape={<CustomCandlestick />}
            barSize={12}
          />

  // EMA Line
  <Line 
    type="monotone" 
    dataKey="ema" 
    stroke="#2962ff" 
    dot={false} 
    strokeWidth={1.5} 
    opacity={0.8}
    animationDuration={300}
  />

  {/* Current Price Line */}
  {data.length > 0 && (
    <ReferenceLine 
      y={data[data.length - 1].close} 
      stroke="#787b86" 
      strokeDasharray="3 3"
      label={{ 
        position: 'right', 
        value: data[data.length - 1].close.toFixed(2), 
        fill: '#787b86', 
        fontSize: 10,
        offset: 10
      }} 
    />
  )}
</ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

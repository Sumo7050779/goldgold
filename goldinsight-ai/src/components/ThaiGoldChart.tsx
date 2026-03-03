import React from 'react';

export const ThaiGoldChart: React.FC = () => {
  return (
    <div className="w-full h-[500px] bg-[#131722] rounded-xl border border-[#2a2e39] shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 bg-[#1e222d] px-4 py-2 border-b border-[#2a2e39] flex justify-between items-center z-10">
        <h3 className="text-[#d1d4dc] font-bold text-sm flex items-center gap-2">
          THAI GOLD 96.5% (HSH)
          <span className="text-[10px] font-normal text-[#787b86] bg-[#2a2e39] px-2 py-0.5 rounded uppercase">Live Chart</span>
        </h3>
        <div className="text-[10px] text-[#787b86]">Source: Hua Seng Heng</div>
      </div>
      <iframe 
        src="https://tradingview965v3.huasengheng.com/" 
        className="w-full h-full pt-10"
        style={{ border: 'none' }}
        title="Thai Gold Chart"
      />
    </div>
  );
};

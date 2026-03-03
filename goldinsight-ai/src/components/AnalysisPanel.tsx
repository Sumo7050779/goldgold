import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Target, BrainCircuit, Newspaper, GraduationCap } from 'lucide-react';
import { MarketAnalysis } from '../services/gemini';
import { motion } from 'motion/react';

interface AnalysisPanelProps {
  analysis: MarketAnalysis | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, isLoading, onAnalyze }) => {
  return (
    <div className="bg-[#1a1b1e] rounded-xl p-6 border border-white/10 shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-medium flex items-center gap-2 text-lg">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          AI Market Insight
        </h3>
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Analyzing...
            </>
          ) : (
            'วิเคราะห์ตลาด'
          )}
        </button>
      </div>

      {!analysis && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3 min-h-[200px]">
          <BrainCircuit className="w-12 h-12 opacity-20" />
          <p>กดปุ่ม "วิเคราะห์ตลาด" เพื่อรับคำแนะนำจาก AI</p>
        </div>
      )}

      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Trend Indicator */}
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${
                analysis.trend === 'bullish' ? 'bg-green-500/20 text-green-400' :
                analysis.trend === 'bearish' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {analysis.trend === 'bullish' ? <TrendingUp size={24} /> :
                 analysis.trend === 'bearish' ? <TrendingDown size={24} /> :
                 <Minus size={24} />}
              </div>
              <div>
                <p className="text-sm text-gray-400">แนวโน้มระยะสั้น</p>
                <p className={`text-xl font-bold ${
                  analysis.trend === 'bullish' ? 'text-green-400' :
                  analysis.trend === 'bearish' ? 'text-red-400' :
                  'text-gray-300'
                }`}>
                  {analysis.trend === 'bullish' ? 'ขาขึ้น (Bullish)' :
                   analysis.trend === 'bearish' ? 'ขาลง (Bearish)' :
                   'ไซด์เวย์ (Neutral)'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">ความมั่นใจ</p>
              <p className="text-xl font-bold text-white">{analysis.confidence}%</p>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h4 className="text-gray-400 text-sm mb-2 flex items-center gap-2">
              <AlertCircle size={14} /> วิเคราะห์แนวโน้ม
            </h4>
            <p className="text-gray-200 text-sm leading-relaxed bg-white/5 p-3 rounded-lg border-l-2 border-purple-500">
              {analysis.reasoning}
            </p>
          </div>

          {/* Prediction & Evidence */}
          <div className="space-y-4">
            <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-500/20">
              <h4 className="text-blue-400 text-sm mb-2 flex items-center gap-2 font-bold">
                <BrainCircuit size={14} /> การทำนายราคา (Prediction)
              </h4>
              <p className="text-white text-sm">
                {analysis.prediction}
              </p>
            </div>
            
            <div className="bg-yellow-900/10 p-4 rounded-lg border border-yellow-500/20">
              <h4 className="text-yellow-400 text-sm mb-2 flex items-center gap-2 font-bold">
                <Newspaper size={14} /> หลักฐานสนับสนุนจากข่าว
              </h4>
              <p className="text-gray-300 text-xs italic leading-relaxed">
                "{analysis.evidence}"
              </p>
            </div>
          </div>

          {/* Key Levels */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-900/10 p-3 rounded-lg border border-red-500/20">
              <p className="text-red-400 text-xs uppercase tracking-wider mb-1">แนวต้าน (Resistance)</p>
              <div className="flex flex-col gap-1">
                {analysis.keyLevels.resistance.map((level, i) => (
                  <span key={i} className="text-white font-mono font-medium">{level.toFixed(2)}</span>
                ))}
              </div>
            </div>
            <div className="bg-green-900/10 p-3 rounded-lg border border-green-500/20">
              <p className="text-green-400 text-xs uppercase tracking-wider mb-1">แนวรับ (Support)</p>
              <div className="flex flex-col gap-1">
                {analysis.keyLevels.support.map((level, i) => (
                  <span key={i} className="text-white font-mono font-medium">{level.toFixed(2)}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-lg border border-white/10">
            <h4 className="text-purple-300 text-sm mb-1 flex items-center gap-2">
              <Target size={14} /> คำแนะนำ
            </h4>
            <p className="text-white font-medium">
              {analysis.recommendation}
            </p>
          </div>

          {/* Learning Insight */}
          <div className="bg-yellow-500/5 p-4 rounded-lg border border-yellow-500/20">
            <h4 className="text-yellow-500 text-sm mb-1 flex items-center gap-2">
              <GraduationCap size={14} /> AI Learning Insight
            </h4>
            <p className="text-gray-300 text-xs italic">
              {analysis.learningInsight}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

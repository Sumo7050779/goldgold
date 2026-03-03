import React from 'react';
import { NewsItem } from '../services/gemini';
import { ExternalLink, Globe, Clock, RefreshCw } from 'lucide-react';

interface NewsFeedProps {
  news: NewsItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news, isLoading, onRefresh }) => {
  return (
    <div className="bg-[#1a1b1e] rounded-xl p-6 border border-white/10 shadow-lg h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-medium flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5 text-blue-400" />
          ข่าวเศรษฐกิจทั่วโลก
        </h3>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
        {isLoading && news.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white/5 rounded-lg p-4 h-32"></div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>ไม่พบข้อมูลข่าว</p>
            <button onClick={onRefresh} className="text-blue-400 text-sm mt-2 hover:underline">ลองใหม่</button>
          </div>
        ) : (
          news.map((item, index) => (
            <div key={index} className="group bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-all border border-transparent hover:border-white/10">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                  item.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {item.sentiment === 'positive' ? 'ส่งผลบวก' : item.sentiment === 'negative' ? 'ส่งผลลบ' : 'ทั่วไป'}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> {item.time}
                </span>
              </div>
              
              <h4 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors">
                {item.title}
              </h4>
              
              <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                {item.summary}
              </p>
              
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                <span className="text-xs text-gray-500">{item.source}</span>
                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    อ่านต่อ <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

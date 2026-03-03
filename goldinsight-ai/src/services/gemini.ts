import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
// Note: In a real production app, we would handle this via a backend to keep the key secure,
// but for this client-side demo we use the injected environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface NewsItem {
  title: string;
  source: string;
  time: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
}

export interface MarketAnalysis {
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  prediction: string;
  evidence: string;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  recommendation: string;
  learningInsight: string; // New field for educational value
}

const PROFESSIONAL_ANALYSIS_GUIDELINES = `
หลักการวิเคราะห์ราคาทองคำอย่างมืออาชีพ:
1. การวิเคราะห์ทางเทคนิค (Technical Analysis):
   - รูปแบบกราฟ (Chart Patterns): Head & Shoulders (กลับตัวลง), Double Top (แนวต้านแข็ง), Double Bottom (แนวรับแข็ง), Triangle (Breakout).
   - แนวรับ-แนวต้าน: การทะลุผ่านจะเปลี่ยนบทบาท (แนวรับกลายเป็นแนวต้านใหม่ และในทางกลับกัน).
   - อินดิเคเตอร์: RSI (Overbought > 70, Oversold < 30), MACD (แรงขับเคลื่อนและ Divergence), Bollinger Bands (ความผันผวนและขอบเขตราคา).

2. การวิเคราะห์ปัจจัยพื้นฐาน (Fundamental Analysis):
   - ทองคำเป็น Safe-haven: อุปสงค์เพิ่มขึ้นเมื่อเศรษฐกิจชะลอตัวหรือเงินเฟ้อสูง.
   - ดัชนีเศรษฐกิจ: GDP โลกชะลอตัวหรือเงินเฟ้อสูงหนุนราคาทอง.
   - อัตราดอกเบี้ย: ดอกเบี้ยขึ้นกดดันทอง (Opportunity cost), ดอกเบี้ยลดหนุนทอง.
   - ค่าเงินดอลลาร์ (USD): ผกผันกับราคาทอง (ดอลลาร์อ่อน = ทองขึ้น).
   - ปริมาณสำรองธนาคารกลาง: การสะสมทองของธนาคารกลางเป็นปัจจัยหนุนราคา.
   - อุปสงค์อุตสาหกรรม: เครื่องประดับ (จีน-อินเดีย) และอิเล็กทรอนิกส์.

3. การวิเคราะห์ข่าวสาร (News Analysis):
   - เศรษฐกิจโลก: ตัวเลข CPI, GDP, การตัดสินใจของ Fed.
   - การเมืองระหว่างประเทศ: ความขัดแย้ง/สงคราม (Geopolitical Risks) หนุนทอง.
   - ความสัมพันธ์กับสินทรัพย์อื่น: ทองมักเคลื่อนไหวตรงข้ามกับหุ้น (Risk-off).
   - วิกฤตโลก: โรคระบาดหรือวิกฤตการเงินทำให้ทองเป็นสินทรัพย์หลบภัย.
`;

export const geminiService = {
  // Analyze market data using Gemini with deep context
  analyzeMarket: async (
    currentPrice: number, 
    priceChange: number, 
    rsi: number, 
    newsContext: NewsItem[],
    marketIndices: any[],
    historySummary: any[]
  ): Promise<MarketAnalysis> => {
    try {
      const model = "gemini-3-flash-preview";
      const newsSummary = newsContext.map(n => `- ${n.title}: ${n.summary}`).join('\n');
      const indicesSummary = marketIndices.map(i => `${i.symbol}: $${i.price} (${i.changePercent}%)`).join(', ');
      const historyText = historySummary.slice(-7).map(h => `${h.date}: O:${h.open} C:${h.close}`).join(' | ');
      
      const prompt = `
        ทำหน้าที่เป็น "AI Master Analyst" ผู้เชี่ยวชาญระดับสูงสุดด้านทองคำและเศรษฐกิจโลก
        ใช้ข้อมูลเชิงลึกทั้งหมดที่มีเพื่อวิเคราะห์และทำนายราคาทองคำ (XAU/USD) อย่างแม่นยำที่สุด
        
        ข้อมูลตลาดปัจจุบัน:
        - ราคาทองคำ: $${currentPrice} (${priceChange > 0 ? '+' : ''}${priceChange}%)
        - RSI (14): ${rsi}
        
        ดัชนีตลาดอื่น (Market Sentiment):
        ${indicesSummary}
        
        ประวัติราคาย้อนหลัง (7 วันล่าสุด):
        ${historyText}
        
        ข่าวสารล่าสุด:
        ${newsSummary}
        
        วิเคราะห์สถานการณ์อย่างลึกซึ้ง โดยพิจารณาความสัมพันธ์ระหว่างสินทรัพย์ (Inter-market Analysis) 
        เช่น ความสัมพันธ์กับ Crypto, ดอลลาร์, และข่าวเศรษฐกิจมหภาค
        
        ตอบกลับเป็น JSON เท่านั้น ตามโครงสร้างนี้:
        {
          "trend": "bullish" | "bearish" | "neutral",
          "confidence": number,
          "reasoning": "วิเคราะห์เชิงลึก (Deep Analysis) โดยอ้างอิงข้อมูลประวัติและดัชนีตลาดอื่น",
          "prediction": "ทำนายราคา 24-48 ชม. พร้อมเป้าหมายราคาที่ชัดเจน",
          "evidence": "หลักฐานจากข่าวและประวัติราคาที่สนับสนุนการทำนาย",
          "keyLevels": {
            "support": [number, number],
            "resistance": [number, number]
          },
          "recommendation": "กลยุทธ์การเทรด (Entry, Stop Loss, Take Profit)",
          "learningInsight": "บทเรียนสำคัญจากสถานการณ์ปัจจุบัน (เพื่อสอนให้ผู้ใช้เก่งขึ้น)"
        }
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
// ... (rest of the code)

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      return JSON.parse(text) as MarketAnalysis;
    } catch (error) {
      console.error("Error analyzing market:", error);
      return {
        trend: 'neutral',
        confidence: 50,
        reasoning: 'ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้',
        prediction: 'แนวโน้มไม่ชัดเจน',
        evidence: 'ขาดข้อมูลข่าวสารที่เพียงพอ',
        keyLevels: { support: [currentPrice - 10, currentPrice - 20], resistance: [currentPrice + 10, currentPrice + 20] },
        recommendation: 'โปรดระมัดระวังในการลงทุน',
        learningInsight: 'การวิเคราะห์ล้มเหลวเนื่องจากปัญหาทางเทคนิค'
      };
    }
  },

  // Get AI Masterclass content for the Learn tab
  getMasterclassContent: async (historySummary: any[]): Promise<string> => {
    try {
      const model = "gemini-3-flash-preview";
      const historyText = historySummary.map(h => `${h.date}: O:${h.open} C:${h.close}`).join('\n');
      
      const prompt = `
        ทำหน้าที่เป็น "Gold Trading Mentor" 
        ใช้ข้อมูลประวัติราคาทองคำ 30 วันล่าสุดนี้:
        ${historyText}
        
        จงสร้าง "บทเรียนการวิเคราะห์ทองคำ (Masterclass)" สำหรับวันนี้ 
        โดยวิเคราะห์จากพฤติกรรมราคาที่เกิดขึ้นจริงใน 30 วันที่ผ่านมา 
        สอนให้ผู้ใช้เข้าใจว่า "ทำไมราคาถึงเคลื่อนไหวแบบนั้น" และ "จุดสังเกตสำคัญคืออะไร"
        
        เนื้อหาควรประกอบด้วย:
        1. สรุปพฤติกรรมราคาในรอบเดือน (Month in Review)
        2. บทเรียนเทคนิคจากกราฟจริง (Technical Lesson from Real Data)
        3. การเชื่อมโยงเหตุการณ์โลกกับราคา (Fundamental Correlation)
        4. แบบฝึกหัดการสังเกตสำหรับพรุ่งนี้ (Observation Exercise)
        
        เขียนเป็นภาษาไทยที่อ่านง่าย เป็นกันเอง แต่เปี่ยมด้วยความรู้ระดับมืออาชีพ
        ใช้ Markdown ในการจัดรูปแบบให้สวยงาม
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      return response.text || "ไม่สามารถสร้างบทเรียนได้ในขณะนี้";
    } catch (error) {
      console.error("Error getting masterclass content:", error);
      return "เกิดข้อผิดพลาดในการโหลดบทเรียน AI Masterclass";
    }
  },

  // Get global news summaries related to gold and economy
  getGlobalNews: async (): Promise<NewsItem[]> => {
    try {
      const model = "gemini-3-flash-preview";
      const prompt = `
        รวบรวมข่าวสารทั่วโลกที่สำคัญที่สุดในรอบ 24 ชั่วโมงที่ผ่านมา (Global News Roundup) 
        โดยแบ่งเป็น 2 ส่วน:
        1. ข่าวเศรษฐกิจและทองคำ (Gold & Macro Economy): ข่าว Fed, CPI, อัตราดอกเบี้ย, ราคาน้ำมัน, และปัจจัยที่กระทบราคาทองคำโดยตรง
        2. ข่าวทั่วไปและเหตุการณ์โลก (World Events & General News): ข่าวการเมืองระหว่างประเทศ, เทคโนโลยี, ภัยธรรมชาติ, หรือเหตุการณ์สำคัญอื่นๆ ที่น่าสนใจ (ทั้งที่เกี่ยวและไม่เกี่ยวกับทองคำ)
        
        เลือกมาทั้งหมด 15 ข่าวที่น่าสนใจที่สุด
        
        สำหรับแต่ละข่าว ให้สรุปเป็นภาษาไทย และวิเคราะห์ผลกระทบ (ถ้ามี) ต่อความเชื่อมั่นของนักลงทุนหรือราคาทองคำ (Sentiment)
        
        ตอบกลับเป็น JSON Array เท่านั้น ตามโครงสร้างนี้:
        [
          {
            "title": "พาดหัวข่าวภาษาไทย",
            "source": "ชื่อสำนักข่าว",
            "time": "เวลาที่เกิดขึ้น",
            "summary": "สรุปเนื้อหาข่าวอย่างละเอียดและวิเคราะห์ผลกระทบ",
            "sentiment": "positive" | "negative" | "neutral",
            "url": "ลิงก์ข่าวต้นฉบับ"
          }
        ]
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      return JSON.parse(text) as NewsItem[];
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    }
  }
};

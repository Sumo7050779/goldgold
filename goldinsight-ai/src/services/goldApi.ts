export interface GoldPriceData {
  timestamp: number;
  metal: string;
  currency: string;
  exchange: string;
  symbol: string;
  prev_close_price: number;
  open_price: number;
  low_price: number;
  high_price: number;
  open_time: number;
  price: number;
  ch: number; // Change
  chp: number; // Change percent
  ask: number;
  bid: number;
}

export const goldApiService = {
  fetchPrice: async (): Promise<GoldPriceData> => {
    const myHeaders = new Headers();
    myHeaders.append("x-access-token", "goldapi-hemfsmm9858ox-io");
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow' as RequestRedirect
    };

    try {
      const response = await fetch("/api/gold-price");
      
      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        throw new Error("Server returned an invalid response (HTML instead of JSON). This usually means the API limit is reached or the proxy is misconfigured.");
      }

      const result = await response.json();
      
      if (!response.ok) {
        // Handle specific API errors like 429 (Rate Limit) or 401 (Unauthorized)
        if (response.status === 429) {
          throw new Error("API Limit Reached: โควตาการใช้งานฟรีรายวันหมดแล้ว");
        }
        if (response.status === 401) {
          throw new Error("API Key Invalid: คีย์ API ไม่ถูกต้อง");
        }
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      
      return result as GoldPriceData;
    } catch (error: any) {
      console.error('Error fetching gold price:', error);
      throw error;
    }
  },
  fetchThaiPrice: async (): Promise<GoldPriceData> => {
    try {
      const response = await fetch("/api/gold-price-th");
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response from Thai Gold API");
      }
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      return result as GoldPriceData;
    } catch (error: any) {
      console.error('Error fetching Thai gold price:', error);
      throw error;
    }
  },
  fetchHistory: async (interval: string = '1m', limit: number = 100): Promise<any[]> => {
    try {
      const response = await fetch(`/api/gold-history?interval=${interval}&limit=${limit}`);
      if (!response.ok) throw new Error("Failed to fetch history");
      return await response.json();
    } catch (error) {
      console.error("Error fetching history:", error);
      throw error;
    }
  },
  fetchMarketIndices: async (): Promise<any[]> => {
    try {
      const response = await fetch("/api/market-indices");
      if (!response.ok) throw new Error("Failed to fetch market indices");
      return await response.json();
    } catch (error) {
      console.error("Error fetching market indices:", error);
      return [];
    }
  },
  fetchHistorySummary: async (): Promise<any[]> => {
    try {
      const response = await fetch("/api/gold-history-summary");
      if (!response.ok) throw new Error("Failed to fetch history summary");
      return await response.json();
    } catch (error) {
      console.error("Error fetching history summary:", error);
      return [];
    }
  }
};

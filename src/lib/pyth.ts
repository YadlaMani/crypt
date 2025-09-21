/* eslint-disable @typescript-eslint/no-explicit-any */
// Pyth Network integration for live crypto price feeds

// Pyth price feed IDs for different tokens
export const PRICE_FEED_IDS = {
  // Mainnet price feed IDs from Pyth Network
  ETH: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD
  MATIC: "5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52", // MATIC/USD
  AVAX: "93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7", // AVAX/USD
  OP: "385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711eda65434c74f5177", // OP/USD
} as const;

// Chain ID to native token mapping
export const CHAIN_NATIVE_TOKENS = {
  "1": "ETH", // Ethereum Mainnet
  "137": "MATIC", // Polygon
  "8453": "ETH", // Base (uses ETH)
  "42161": "ETH", // Arbitrum (uses ETH)
  "10": "OP", // Optimism (uses OP)
  "43114": "AVAX", // Avalanche
} as const;

type PythPriceResponse = {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
  ema_price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
};

export class PythPriceService {
  private baseUrl = "https://hermes.pyth.network/api";

  /**
   * Get the current price of a token in USD
   */
  async getTokenPrice(
    tokenSymbol: keyof typeof PRICE_FEED_IDS
  ): Promise<number> {
    try {
      const feedId = PRICE_FEED_IDS[tokenSymbol];
      if (!feedId) {
        throw new Error(`No price feed found for token: ${tokenSymbol}`);
      }

      const url = `${this.baseUrl}/latest_price_feeds?ids[]=${feedId}`;
      console.log(`Fetching price for ${tokenSymbol} from: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "CryptoCheckout/1.0",
        },
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PythPriceResponse[] = await response.json();
      console.log(`Received data:`, data);

      const priceFeed = data[0];

      if (!priceFeed || !priceFeed.price) {
        throw new Error(`No price data available for ${tokenSymbol}`);
      }

      // Pyth prices come with an exponent, so we need to calculate the actual price
      const price = parseInt(priceFeed.price.price);
      const exponent = priceFeed.price.expo;
      const actualPrice = price * Math.pow(10, exponent);

      console.log(`Calculated price for ${tokenSymbol}: $${actualPrice}`);
      return actualPrice;
    } catch (error) {
      console.error(`Error fetching price for ${tokenSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Convert USD amount to native token amount for a specific chain
   */
  async convertUsdToNativeToken(
    usdAmount: number,
    chainId: string
  ): Promise<{
    nativeAmount: number;
    tokenSymbol: string;
    price: number;
  }> {
    try {
      const tokenSymbol =
        CHAIN_NATIVE_TOKENS[chainId as keyof typeof CHAIN_NATIVE_TOKENS];

      if (!tokenSymbol) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const tokenPrice = await this.getTokenPrice(tokenSymbol);
      const nativeAmount = usdAmount / tokenPrice;

      return {
        nativeAmount,
        tokenSymbol,
        price: tokenPrice,
      };
    } catch (error) {
      console.error(
        `Error converting USD to native token for chain ${chainId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get prices for multiple tokens at once
   */
  async getMultipleTokenPrices(
    tokens: Array<keyof typeof PRICE_FEED_IDS>
  ): Promise<Record<string, number>> {
    try {
      const feedIds = tokens
        .map((token) => PRICE_FEED_IDS[token])
        .filter(Boolean);
      const idsParams = feedIds.map((id) => `ids[]=${id}`).join("&");
      const url = `${this.baseUrl}/latest_price_feeds?${idsParams}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PythPriceResponse[] = await response.json();
      const prices: Record<string, number> = {};

      data.forEach((priceFeed, index) => {
        if (priceFeed && priceFeed.price) {
          const tokenSymbol = tokens[index];
          const price = parseInt(priceFeed.price.price);
          const exponent = priceFeed.price.expo;
          const actualPrice = price * Math.pow(10, exponent);
          prices[tokenSymbol] = actualPrice;
        }
      });

      return prices;
    } catch (error) {
      console.error("Error fetching multiple token prices:", error);
      throw error;
    }
  }

  /**
   * Get live conversion rates for all supported chains
   */
  async getAllChainConversionRates(usdAmount: number): Promise<
    Record<
      string,
      {
        nativeAmount: number;
        tokenSymbol: string;
        price: number;
      }
    >
  > {
    try {
      const uniqueTokens = [...new Set(Object.values(CHAIN_NATIVE_TOKENS))];
      const prices = await this.getMultipleTokenPrices(uniqueTokens);

      const conversionRates: Record<string, any> = {};

      Object.entries(CHAIN_NATIVE_TOKENS).forEach(([chainId, tokenSymbol]) => {
        const tokenPrice = prices[tokenSymbol];
        if (tokenPrice) {
          conversionRates[chainId] = {
            nativeAmount: usdAmount / tokenPrice,
            tokenSymbol,
            price: tokenPrice,
          };
        }
      });

      return conversionRates;
    } catch (error) {
      console.error("Error getting all chain conversion rates:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const pythPriceService = new PythPriceService();

// Utility function to format native token amounts with proper decimals
export function formatNativeAmount(
  amount: number,
  tokenSymbol: string
): string {
  const decimals = tokenSymbol === "ETH" ? 6 : 4; // More precision for ETH
  return amount.toFixed(decimals);
}

// Utility function to format USD amounts
export function formatUsdAmount(amount: number): string {
  return amount.toFixed(2);
}

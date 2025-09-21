import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Price API called');
    const { searchParams } = new URL(request.url);
    const usdAmount = searchParams.get('amount');
    const chainId = searchParams.get('chainId');

    console.log('Received params:', { usdAmount, chainId });

    if (!usdAmount) {
      return NextResponse.json(
        { error: 'USD amount is required' },
        { status: 400 }
      );
    }

    const amount = parseFloat(usdAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid USD amount' },
        { status: 400 }
      );
    }

    console.log('Processing amount:', amount);

    // Chain to native token mapping - tokens used for gas/payments
    const CHAIN_NATIVE_TOKENS: Record<string, string> = {
      '1': 'ETH',      // Ethereum Mainnet - ETH for gas
      '8453': 'ETH',   // Base - ETH for gas  
      '137': 'ETH',    // Polygon - temporarily use ETH price for POL (need correct price feed)
      '42161': 'ETH',  // Arbitrum - ETH for gas (ARB is governance token)
      '10': 'ETH',     // Optimism - ETH for gas (OP is governance token)
      '43114': 'AVAX', // Avalanche - AVAX for gas
    };

    // Display names for tokens (what users see)
    const CHAIN_DISPLAY_TOKENS: Record<string, string> = {
      '1': 'ETH',      // Ethereum Mainnet
      '8453': 'ETH',   // Base
      '137': 'POL',    // Polygon 
      '42161': 'ARB',  // Arbitrum (show ARB but price with ETH)
      '10': 'OP',      // Optimism (show OP but price with ETH)
      '43114': 'AVAX', // Avalanche
    };

    // Pyth price feed IDs for the tokens used for pricing
    const PRICE_FEED_IDS: Record<string, string> = {
      ETH: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',   // ETH/USD
      POL: '5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',   // MATIC/USD
      AVAX: '93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7', // AVAX/USD
      ARB: '3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',   // ARB/USD
      OP: '385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',    // OP/USD
    };

    // If specific chain is requested
    if (chainId) {
      const displayToken = CHAIN_DISPLAY_TOKENS[chainId];
      const priceToken = CHAIN_NATIVE_TOKENS[chainId];
      
      if (!displayToken || !priceToken) {
        return NextResponse.json({
          error: `Unsupported chain ID: ${chainId}`
        }, { status: 400 });
      }

      // For ARB and OP, use their direct token prices, otherwise use the gas token
      const tokenForPrice = (chainId === '42161' || chainId === '10') ? displayToken : priceToken;
      const feedId = PRICE_FEED_IDS[tokenForPrice];
      
      if (!feedId) {
        return NextResponse.json({
          error: `No price feed for token: ${tokenForPrice}`
        }, { status: 400 });
      }

      const pythUrl = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${feedId}`;
      console.log(`Fetching ${tokenForPrice} price for chain ${chainId} from:`, pythUrl);
      
      const pythResponse = await fetch(pythUrl);
      console.log('Pyth response status:', pythResponse.status);
      
      if (!pythResponse.ok) {
        const errorText = await pythResponse.text();
        console.error('Pyth API error:', errorText);
        return NextResponse.json({
          error: 'Pyth API error',
          status: pythResponse.status,
          details: errorText
        }, { status: 500 });
      }
      
      const pythData = await pythResponse.json();
      console.log('Pyth data received:', pythData);
      
      const priceFeed = pythData[0];
      if (!priceFeed || !priceFeed.price) {
        return NextResponse.json({
          error: 'No price data available'
        }, { status: 500 });
      }
      
      const price = parseInt(priceFeed.price.price);
      const exponent = priceFeed.price.expo;
      const tokenPrice = price * Math.pow(10, exponent);
      const nativeAmount = amount / tokenPrice;
      
      console.log(`Calculated ${tokenForPrice} price: $${tokenPrice}`);
      
      return NextResponse.json({
        success: true,
        data: {
          usdAmount: amount,
          chainId,
          nativeAmount,
          tokenSymbol: displayToken, // Show display token (ARB, OP, etc.)
          price: tokenPrice
        }
      });
    }

    // Get conversions for all supported chains (for preview)
    const conversions: Record<string, any> = {};
    
    // Get all unique tokens we need prices for
    const allTokensNeeded = new Set<string>();
    
    for (const chainId of Object.keys(CHAIN_DISPLAY_TOKENS)) {
      const displayToken = CHAIN_DISPLAY_TOKENS[chainId];
      const priceToken = CHAIN_NATIVE_TOKENS[chainId];
      
      // For ARB and OP chains, use their token prices directly
      if (chainId === '42161' || chainId === '10') {
        allTokensNeeded.add(displayToken);
      } else {
        allTokensNeeded.add(priceToken);
      }
    }
    
    const tokenPrices: Record<string, number> = {};
    
    // Fetch prices for all needed tokens
    for (const token of Array.from(allTokensNeeded)) {
      const feedId = PRICE_FEED_IDS[token];
      if (!feedId) continue;
      
      try {
        const pythUrl = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${feedId}`;
        console.log(`Fetching ${token} price from:`, pythUrl);
        
        const pythResponse = await fetch(pythUrl);
        if (!pythResponse.ok) continue;
        
        const pythData = await pythResponse.json();
        const priceFeed = pythData[0];
        
        if (priceFeed && priceFeed.price) {
          const price = parseInt(priceFeed.price.price);
          const exponent = priceFeed.price.expo;
          tokenPrices[token] = price * Math.pow(10, exponent);
          console.log(`${token} price: $${tokenPrices[token]}`);
        }
      } catch (error) {
        console.error(`Error fetching ${token} price:`, error);
      }
    }
    
    // Calculate conversions for each chain
    for (const chainId of Object.keys(CHAIN_DISPLAY_TOKENS)) {
      const displayToken = CHAIN_DISPLAY_TOKENS[chainId];
      const priceToken = CHAIN_NATIVE_TOKENS[chainId];
      
      // Determine which token price to use
      const tokenForPrice = (chainId === '42161' || chainId === '10') ? displayToken : priceToken;
      const tokenPrice = tokenPrices[tokenForPrice];
      
      if (tokenPrice) {
        conversions[chainId] = {
          nativeAmount: amount / tokenPrice,
          tokenSymbol: displayToken, // Always show the display token
          price: tokenPrice
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        usdAmount: amount,
        conversions
      }
    });

  } catch (error) {
    console.error('Price API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch price data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Endpoint to get current prices for all supported tokens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokens } = body;

    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'Tokens array is required' },
        { status: 400 }
      );
    }

    const prices = await pythPriceService.getMultipleTokenPrices(tokens);
    
    return NextResponse.json({
      success: true,
      data: {
        prices,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Bulk Price API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch bulk price data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

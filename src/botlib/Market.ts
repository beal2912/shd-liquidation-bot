



export interface MarketData{
    id: number,
    name: string,
    exchange: string,
    base: string,
    quote: string,
    basePrecision: number,
    quotePrecision: number,
    baseLotSize: number,
    quoteLotSize: number,
    baseWeight?: number,
    quoteWeight?: number,
    fee: number,
    minQuantity: number,
    marketType: string,
    isActive: boolean,
    contract: string,
    codeHash?: string,
    delay?: number,
    incentive?: boolean,
    marketPrecision?: number,
}


export interface OrderBookLevel {
    price: string;
    quantity: string;
}

export interface Books {
    asks: OrderBookLevel[],
    bids: OrderBookLevel[],
    height?: number,
    baseWeight?: number,
    quoteWeight?: number,
}

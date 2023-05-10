import { MarketData } from "./Market";








export class Route{
    
    marketPath: MarketData[] = []
    tokenIn: string
    tokenOut: string
  

    constructor( tokenIn: string, tokenOut: string, marketPath: MarketData[]) {
        this.tokenIn = tokenIn
        this.tokenOut = tokenOut
        this.marketPath = marketPath
    }

    
    print(){
        let out: string ="";
        for(const market of this.marketPath){
            out= out + market.name + ' > ' ;
        }
        return out;
    }
}
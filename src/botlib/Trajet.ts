

import { cloneDeep } from "lodash";
import { MarketData } from "./Market";
import { Route } from "./Route";




export class Trajet{
    
    routeList: Route[] = []
    tokenIn: string
    tokenOut: string
    index=0

    constructor( tokenIn: string, tokenOut: string) {
        this.tokenIn = tokenIn
        this.tokenOut = tokenOut
    }


    loadRoute(depth: number, marketList: MarketData[]) {
        this.findPath([this.tokenIn], this.tokenOut, marketList, [], depth);
    }


    findPath(token: string[], tokenOut: string, list: MarketData[], equalizer: MarketData[], depth: number) {
    
        this.index++
        let i = this.index
    
        if(equalizer.length >= depth){
            return false
        }
    
        let validMarket = this.findValidMarket(token[token.length-1],list);
        
    
        if (validMarket.length == 0){
            return false
        }
        validMarket.forEach((market) => {
    
            let flag = false
            if(market.base == token[(token.length-1)]){
                token.push(market.quote)
            }
            else{
                token.push(market.base)
            }
    
            let tmpList = this.removeMarket(market, list)
            
            equalizer.push(this.getMarket(market.name,market.exchange,list))
            
            
    
            if(token[(token.length-1)] == tokenOut){
                this.routeList.push(new Route(this.tokenIn, this.tokenOut, cloneDeep(equalizer)))
                flag = true
            }
    
            if(!flag){
                this.findPath(token, tokenOut, tmpList, equalizer, depth)
            }
    
            if(equalizer.length > 1 || i == 1){
                equalizer.splice((equalizer.length-1),1)
            }
            if(token.length > 1){
                token.splice((token.length-1),1)
            }
        });
    
        return false;  
    }


    findValidMarket(token: string, list: MarketData[]){
        let result: MarketData[] = []
    
        for(let market of list) {
            if ((market.base == token || market.quote == token) && (market.marketType == "spot" || market.marketType == "stable") && market.isActive == true) {
                result.push(market)
            }
        }
        return result
    }

    removeMarket(needle: MarketData, list: MarketData[]){
        let result: MarketData[] = []
        for(let market of list) {
            if (market.id != needle.id) {
                result.push(market)
            }
        }
        return result
    }
    getMarket(name: string, exchange: string, list: MarketData[]){
        
        for(const market of list){
            if( market.name === name && market.exchange === exchange){
                return market
            }
        }
        return {} as MarketData
    }

    getMarketStringList(){
        let result: string[] = []
        for(const route of this.routeList){
            for(const market of route.marketPath){
                if(result.indexOf(market.name) == -1){
                    result.push(market.name);
                }
            }
        }
        return result
    }

    print(){
        let out: string ="";
        for(let route of this.routeList){
            out= out + route.print() + '\n';
        }
        return out;
    }
}
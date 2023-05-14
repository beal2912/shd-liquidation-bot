import { MsgExecuteContract, SecretNetworkClient, TxResponse } from "secretjs";
import { secretAllMarket } from "./SecretMarket";
import { Token } from "./SecretWallet";
import { Route } from "./botlib/Route";
import { Trajet } from "./botlib/Trajet";
import BigNumber from "bignumber.js";
import { log } from "./botlib/Logger";
import { MarketData } from "./botlib/Market";
import { floor } from "lodash";
import { Error } from "./botlib/Error";
import { delay } from "./botlib/utils";





interface RouterList{
    [index: string]: Router
}

export interface Router{
    contract: string,
    codehash?: string,
}

export const routerList = {} as RouterList
// Router list we should be able to add sienna and secretswap 1 & 2
routerList["shade"] = {contract: "secret1pjhdug87nxzv0esxasmeyfsucaj98pw4334wyc", codehash:"448e3f6d801e453e838b7a5fbaa4dd93b84d0f1011245f0d5745366dadaf3e85"}





// Route
/****************************************************************************** */ 
export function getRouteList(tokenIn: Token, tokenOut: Token, maxHop?: number){

    if(!maxHop){
        maxHop=4
    }
    let trajet = new Trajet(tokenIn.contract, tokenOut.contract)
    trajet.loadRoute(maxHop,secretAllMarket)

    return trajet.routeList
}


// Simulate 
/****************************************************************************** */ 
export async function simulateBestSwap(client: SecretNetworkClient, routeList: Route[], amount: number, tokenIn: Token, tokenOut: Token){

    let bestRoute =  {} as Route
    let bestresult: number = 0 
    for(let route of routeList){
        let result = await simulateShadeSwap(client, route, tokenIn, tokenOut, amount)
        log.info("Route: "+route.print() + " expected result = "+result +" "+tokenOut.name )
        if(result > bestresult){
            bestRoute = route
            bestresult = result
        }

    }
    if(bestresult > 0 ){
       return bestRoute 
    }
}



async function simulateShadeSwap(client: SecretNetworkClient, route: Route, tokenIn: Token, tokenOut: Token, amount: number): Promise<number> {
    
    let path: {addr:string,code_hash:string}[] = []
    for(let step of route.marketPath){
        path.push({addr: step.contract,code_hash: step.codeHash ?? ""})
    }

    try{
        

        let quantityIn = new BigNumber(amount).shiftedBy(tokenIn.decimals)
        const info: any = await client.query.compute.queryContract({
            contract_address: routerList["shade"].contract,
            code_hash: routerList["shade"].codehash,
            query: { 
            swap_simulation: {
                offer: { 
                token:  {
                    custom_token: {
                    contract_addr: tokenIn.contract,
                    token_code_hash: tokenIn.codehash,
                    } 
                }, 
                amount: quantityIn.toString(), 
                },
                path: path
            }
            }
        })
        
        let result = new BigNumber(info.swap_simulation.result.return_amount).shiftedBy(-tokenOut.decimals).toNumber()
        return result
    }
    catch(e: any){
        log.info("Exception simulateShadeSwap")
        log.info(e.message)
        return 0
    }
}



// Execute 
/****************************************************************************** */ 

export async function executeTrade(client: SecretNetworkClient, route: Route, tokenIn: Token, amountIn: number): Promise<TxResponse|undefined>{

    let stepByExchange = groupTradeByExchange(route)
    let msgList: MsgExecuteContract<any>[] = []


    for(let action of Object.keys(stepByExchange)){
        let exchange = action.split("-") 
        // if we use multiple router we need the initial balance foreach of this router
        // todo get the wallet check all needed balance

        if(exchange[0] === "shade"){
            msgList.push(getShadeSwapMsg(stepByExchange[action], client.address, tokenIn, amountIn))
        }
    }
    if(msgList.length > 0){
        try{
      
            let tx = await client.tx.broadcast(msgList, {
                gasLimit: 910_000 * (msgList.length) +  650_000 * (route.marketPath.length),
                gasPriceInFeeDenom: 0.0125,
                feeDenom: "uscrt",
            })

            if(tx.rawLog){
                log.info(JSON.stringify(tx.rawLog))
                if(tx.rawLog.includes("failed to execute")){
                    throw "functionnal error"
                }
            }

            return tx
        }
        catch(e: any){
            log.info("Exception executeTrade")
            log.info(e.message)
            log.info(e.code)

            let error = new Error(e)
            if(error.isKo()){ 
                await delay(2000)
                return await executeTrade(client, route, tokenIn, amountIn)
            }            
        }
    }
}


// useful if we must use several router contract
function groupTradeByExchange(route: Route): { [exchange: string]: MarketData[] } {
    const actionsByExchange: { [exchange: string]: MarketData[] } = {}; // tableaux d'actions par exchange
     
    let lastExchange= ""
    let id=0
    let i=0
    for (const step of route.marketPath) {
        if(lastExchange!==step.exchange){
            lastExchange=step.exchange
            id=i
        }
        if(actionsByExchange[lastExchange+"-"+id]){
            actionsByExchange[lastExchange+"-"+id].push(step)
        }
        else{
            actionsByExchange[lastExchange+"-"+id] = []
            actionsByExchange[lastExchange+"-"+id].push(step)
        }            
        
    }
  
    return actionsByExchange;
}


function getShadeSwapMsg(stepList:MarketData[],sender: string, tokenIn: Token, amountIn: number){

    let pathList: {addr:string,code_hash:string}[] = []
    for(let step of stepList){
        pathList.push({addr: step.contract,code_hash:step.codeHash ?? ""})
    }


    let quantityIn = new BigNumber(amountIn).shiftedBy(tokenIn.decimals).toString()

    //let quantityOut = new BigNumber(amountOut).shiftedBy(tokenOut.decimals).toString()
    //expected_return: quantityOut,

    let swapMsg = {
        swap_tokens_for_exact:{
            path: pathList
        }
    }
    let buf = Buffer.from(JSON.stringify(swapMsg))
    let msg = new MsgExecuteContract({
        sender: sender,
        contract_address: tokenIn.contract,
        code_hash: tokenIn.codehash,
        msg: { 
            send: {
                recipient: routerList['shade'].contract,
                recipient_code_hash: routerList['shade'].codehash,
                amount: quantityIn,
                msg: buf.toString('base64')
            }    
        },
    })
    return msg
}





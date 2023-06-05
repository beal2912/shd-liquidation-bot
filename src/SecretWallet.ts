import { SecretNetworkClient } from "secretjs";
import { log } from "./botlib/Logger";
import BigNumber from "bignumber.js";
import { delay } from "./botlib/utils";
import { Error } from "./botlib/Error";


export interface Token{
    name: string,
    contract: string, 
    codehash: string,
    decimals: number,
    key: string,
    min_amount?: number,
}

export async function getPublicBalance(client: SecretNetworkClient, denom: string, address: string): Promise<number>{
    try{
        log.info("query contract - " + denom)
        let info: any = await client.query.bank.balance({
            address: address,
            denom: denom
        })
        let result = new BigNumber(info.balance.amount).shiftedBy(-6).toNumber()
        return result
    }
    catch(e: any){
        log.info("Exception updateScrtBalance")
        log.info(e.code)
        log.info(e.message)
        let error = new Error(e)
        if(error.isKo() || error.isNotSure()){
            await delay(3000)
            return await getPublicBalance(client, denom, address)
        }
    }      
    return 0

}




export async function getUpdatedSecretBalance(client: SecretNetworkClient, token: Token, address: string): Promise<number>{
     
    try{
        log.info("query contract - " + token.contract)
        let info: any = await client.query.compute.queryContract({
            contract_address: token.contract,
            code_hash: token.codehash ?? "",
            query: { 
                balance: {
                    address: address,
                    key: token.key,
                }
            }
        })
        let result = new BigNumber(info.balance.amount).shiftedBy(-token.decimals).toNumber()
        return result
    }
    catch(e: any){
        log.info("Exception updateScrtBalance")
        log.info(e.code)
        log.info(e.message)
        let error = new Error(e)
        if(error.isKo() || error.isNotSure()){
            await delay(3000)
            return await getUpdatedSecretBalance(client, token, address)
        }
    }      
    return 0
}
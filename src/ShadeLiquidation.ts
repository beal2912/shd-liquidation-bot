import { MsgExecuteContract, SecretNetworkClient, TxResponse } from "secretjs";
import { Wallet as SecretWallet } from 'secretjs';
import { log } from "./botlib/Logger"
import { Error } from "./botlib/Error";
import { delay } from "./botlib/utils";


require('dotenv').config();

export interface Vault{
    id: string,
    name: string,
    registry: string, 
    contract: string,
    codehash: string,
}

export interface Position{
    vault: Vault,
    id: string,
}


const gasprice = process.env.GASPRICE ?? "0.1"


export async function queryVaultForLiquidation(secretjs: SecretNetworkClient,vault: Vault):Promise<any>{
    try{
        let result: any = await secretjs.query.compute.queryContract({
            contract_address: vault.contract,
            code_hash: vault.codehash,
            query: { 
                liquidatable_positions: { vault_id: vault.id }
            }
        }) 
        return result

    }
    catch(e: any){
        log.info("Exception queryVaultForLiquidation : "+ e.message)
        let error = new Error(e)
        if(error.isKo() || error.isNotSure()){
            log.info("Rpc Error or timeout, let's retry the liquidation ")
            await delay(5000)
            return await queryVaultForLiquidation(secretjs,vault)
        }
        else{
            log.info("Unknown error, perhaps functionnal")
            return {positions: []}
        }

    }



}

export async function liquidatePosition(secretjs: SecretNetworkClient, sender: string, vault: Vault, positionId: string ):Promise<TxResponse|undefined>{
    try{
        let msg = new MsgExecuteContract({
            sender: sender,
            contract_address: vault.contract,
            code_hash: vault.codehash,
            msg: { 
                liquidate: {
                    vault_id: vault.id,
                    position_id: positionId,
                }    
            },
        })
        let resp = await secretjs.tx.broadcast([msg], {
            gasLimit: 750_000,
            gasPriceInFeeDenom: Number(gasprice),
            feeDenom: "uscrt",
        })
        return resp
    }
    catch(e: any){
        log.info("Exception liquidatePosition : "+ e.message)
        let error = new Error(e)
        if(error.isKo() || error.isNotSure()){
            log.info("Rpc Error or timeout, let's retry the liquidation ")
            await delay(5000)
            return await liquidatePosition(secretjs, sender, vault, positionId)
        }
        else{
            log.info("Unknown error, perhaps functionnal")
        }

    }
}

export async function liquidateBatchPosition(secretjs: SecretNetworkClient, sender: string, batch: Position[] ):Promise<TxResponse|undefined>{
    try{

        let msgList: any[] = []
        
        for(let position of batch){
            let msg = new MsgExecuteContract({
                sender: sender,
                contract_address: position.vault.contract,
                code_hash: position.vault.codehash,
                msg: { 
                    liquidate: {
                        vault_id: position.vault.id,
                        position_id: position.id,
                    }    
                },
            })
            msgList.push(msg)
        }
        log.info("Starting broadcast liquidateBatchPosition")
        let resp = await secretjs.tx.broadcast(msgList, {
            gasLimit: 750_000 * msgList.length,
            gasPriceInFeeDenom: Number(gasprice),
            feeDenom: "uscrt",
        })
        if(resp.rawLog){
            log.info(resp.rawLog)
                        if(resp.rawLog.includes("failed to execute")){
                const tx2 = await secretjs.query.getTx(resp.transactionHash)
                log.info(tx2?.arrayLog)
            }
        }

        return resp
    }
    catch(e: any){
        log.info("Exception liquidatePosition : "+ e.message)
        let error = new Error(e)
        if(error.isKo() || error.isNotSure()){
            log.info("Rpc Error or timeout, let's retry the liquidation ")
            await delay(5000)
            return await liquidateBatchPosition(secretjs, sender, batch)
        }
        else{
            log.info("Unknown error, perhaps functionnal")
        }

    }
}



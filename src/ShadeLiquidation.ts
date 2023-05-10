import { MsgExecuteContract, SecretNetworkClient, TxResponse } from "secretjs";
import { Wallet as SecretWallet } from 'secretjs';
import { log } from "./botlib/Logger"
import { Error } from "./botlib/Error";




export interface Vault{
    id: string,
    name: string,
    registry: string, 
    contract: string,
    codehash: string,
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
            gasLimit: 1_000_000,
            gasPriceInFeeDenom: 0.0125,
            feeDenom: "uscrt",
        })
        return resp
    }
    catch(e: any){
        log.info("Exception liquidatePosition : "+ e.message)
        let error = new Error(e)
        if(error.isKo() || error.isNotSure()){
            log.info("Rpc Error or timeout, let's retry the liquidation ")
            return await liquidatePosition(secretjs, sender, vault, positionId)
        }
        else{
            log.info("Unknown error, perhaps functionnal")
        }

    }
}
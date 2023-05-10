import { MsgExecuteContract, SecretNetworkClient, TxResultCode } from "secretjs";
import { Wallet as SecretWallet } from 'secretjs';

import { delay } from "./botlib/utils";
import { log } from "./botlib/Logger";

import * as BIP39 from "bip39";

import { Vault, liquidatePosition } from "./ShadeLiquidation";
import { Token, getPublicBalance, getUpdatedSecretBalance } from "./SecretWallet";
import { executeTrade, getRouteList, simulateBestSwap } from "./SecretTrade";



const fs = require('fs');
require('dotenv').config();




(async () => {
    log.info("Init loading Vaults..")
    log.info("=======================================================")
    const envVaults = process.env.VAULTS ?? ""
    const vaults = JSON.parse(envVaults)

    const lcd = process.env.LCD ?? ""
    const mnemonic = process.env.MNEMONICS ?? BIP39.generateMnemonic()

    const envTokenList = process.env.TOKENLIST ?? ""
    const tokenList = JSON.parse(envTokenList)

    let silk: Token = tokenList.tokens.find( (w: Token) => w.contract === "secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd")


    var vaultList: Vault[] = []


    const signer = new SecretWallet( mnemonic ) 
    const secretjs = new SecretNetworkClient({
        url: lcd,
        chainId: "secret-4",
        wallet: signer,
        walletAddress: signer.address,
    })


    for(let contract of vaults.list){
        
        let page = 1
        let totalPage = 1
        while(page <= totalPage){
            const result: any = await secretjs.query.compute.queryContract({
                contract_address: contract.contract,
                code_hash: contract.codehash,
                query: { 
                    vaults: { starting_page: page.toString() }
                }
            }) 
            totalPage = result.total_pages
            page++
            
            for(let item of result.vaults){
                vaultList.push({
                                id: item.vault.id, 
                                name: item.vault.name, 
                                registry: contract.name,
                                contract: contract.contract,
                                codehash: contract.codehash,
                            })
                log.info("id:"+item.vault.id +" - "+ item.vault.name +" of "+contract.name+" loaded")
            }
        }
        
    }

    log.info("loading Vaults done !")
    log.info("=======================================================")

    let scrtBalance = await getPublicBalance(secretjs, 'uscrt', signer.address)
    log.info("Your address: "+signer.address)
    log.info("scrt: "+scrtBalance)
    if(scrtBalance < 0.5){
        log.info("You need some secret token in your wallet for Gas Fee")
        await delay(2000)
        process.exit(0)
    }
    log.info("=======================================================")

    





    while(true){
        log.info("Checking for liquidation")

        for(let vault of vaultList){
            
            let result: any = await secretjs.query.compute.queryContract({
                contract_address: vault.contract,
                code_hash: vault.codehash,
                query: { 
                    liquidatable_positions: { vault_id: vault.id }
                }
            }) 
            log.info(vault.name + " -> "+result.positions.length)
            if(result.positions.length > 0){
                log.info("nb position to liquidate: "+ result.positions.length)
                for(let position of result.positions){
                    
                    log.info("Execute liquidation on vault :"+vault.name+ " position id:"+ position.position_id )
                    let result = await liquidatePosition(secretjs, signer.address, vault, position.position_id )

                    if(result){
                        if(result.code == 0){
                            log.info("liquidation done :"+result.transactionHash )

                            log.info("checking wallet balance :")
                            log.info("===".repeat(10))
                            for(let token of tokenList.tokens){
                                let amount = await getUpdatedSecretBalance(secretjs, token, signer.address)
                                log.info(token.name+" :"+amount )
                                if(token.min_amount){
                                    if(amount >= token.min_amount){
                                        log.info(token.name+ " balance "+amount+" is >= min_amount "+token.min_amount)
                                        log.info("let swap "+token.name+" into SILK")

                                        let routeList = getRouteList(token, silk)
                                        log.info("we find "+routeList.length+" route(s) to make the trade")
                                        let bestRoute = await simulateBestSwap(secretjs, routeList, amount, token, silk)
                                        if(bestRoute){
                                            log.info("Starting Swap Broadcast")
                                            let swapTx = await executeTrade(secretjs, bestRoute, token, amount)
                                            if(swapTx){
                                                log.info("Swap result:"+ (swapTx.code == TxResultCode.Success ? " Success" : " Ko") )
                                                log.info("txHash:"+ swapTx.tx)
                                                log.info("txHash:"+ swapTx.rawLog)
                                            }
                                        }
                                    
                                    }
                                }
                                
                            }
                        }
                    }
                    
                }
            }
        }








        await delay(6000)       
    }




})().catch(console.error).finally(() => process.exit(0));







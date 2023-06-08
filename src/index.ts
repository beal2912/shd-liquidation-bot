import { MsgExecuteContract, SecretNetworkClient, TxResultCode } from "secretjs";
import { Wallet as SecretWallet } from 'secretjs';

import { delay } from "./botlib/utils";
import { log } from "./botlib/Logger";

import * as BIP39 from "bip39";
import { WebSocket } from "ws";
import { Position, Vault, liquidateBatchPosition, liquidatePosition, queryVaultForLiquidation } from "./ShadeLiquidation";
import { Token, getPublicBalance, getUpdatedSecretBalance } from "./SecretWallet";
import { executeTrade, getRouteList, simulateBestSwap } from "./SecretTrade";


require('dotenv').config();




(async () => {

    var connexionClosed = false
    var isConnected = false
    var ws =  {} as WebSocket

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

    




    

    var onOpen = function() {
        log.info('OPENED')
        isConnected=true
    }
    var onClose = function() {
        log.info('CLOSED')
        isConnected=false
        connexionClosed=true
    };
    
    var onMessage = async function(event: any) {
        log.info("Checking for liquidation")

        const promises = vaultList.map(async (vault) => {
            const result = await queryVaultForLiquidation(secretjs, vault)
            log.info(vault.name + " -> " + result.positions.length)
            return { vault, result }
        })
        const results = await Promise.all(promises)

        let positionToLiquidate: Position[] = []
        for (const { vault, result } of results) {
            if(result.positions.length > 0){
                for (const position of result.positions) {
                    log.info("liquidation to execute on vault: " + vault.name + " position id: " + position.position_id)
                    positionToLiquidate.push({vault: vault, id: position.position_id})
                }
            }
        }

        if(positionToLiquidate.length > 0){
            let result = await liquidateBatchPosition(secretjs, signer.address, positionToLiquidate )
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


    var onError = function(event: any) {
        log.info('ERROR: '+event.type)
        isConnected=false
        connexionClosed=true
    }


    await initWs()
    
    while(true){
        if(connexionClosed){
            initWs()
            connexionClosed=false
        }
        await delay(6000)
           
    }
    
    
    async function initWs(){

        ws =  new WebSocket("wss://rpc.secret.express/websocket")
        ws.onopen = onOpen
        ws.onclose = onClose
        ws.onmessage = onMessage
        ws.onerror = onError
    
        while(!isConnected){
            await delay(500)
        }
        
        ws.send('{ "id": "1","method": "subscribe","params": {"query": "tm.event=\'NewBlock\'" } }')

    }







})().catch(console.error).finally(() => process.exit(0));







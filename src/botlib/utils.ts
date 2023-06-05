

import { BigNumber } from "bignumber.js";


export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) )
}


export function quantityToNumber(quantity: string, decimal: number){
    let result = Number(quantity)/Math.pow(10,decimal);
    return result
}


export function priceToNumber(price: string, baseDecimal: number, quoteDecimal: number){
    
    let orderPrice = new BigNumber(price)
    const diffDp = quoteDecimal - baseDecimal
    orderPrice = orderPrice.shiftedBy(-diffDp)
    
    return orderPrice.toNumber()
}

export function quantityToString(q: number, baseDecimal: number){
    let orderPrice = new BigNumber(q)
    orderPrice = orderPrice.shiftedBy(baseDecimal);
    return orderPrice.toString()
}

export function round(value: number, lotSize: number) {
    let precision = Math.log10(1/lotSize)
    let factor = Math.pow(10, precision)
    return Math.round(value * factor) / factor
}
export function ceil(value: number, lotSize: number) {
    let precision = Math.log10(1/lotSize)
    let factor = Math.pow(10, precision)
    return Math.ceil(value * factor) / factor
}
export function floor(value: number, lotSize: number) {
    let precision = Math.log10(1/lotSize)
    let factor = Math.pow(10, precision)
    return Math.floor(value * factor) / factor
}

export function strip(value: number) {
    return Number((value.toPrecision(12)))
}
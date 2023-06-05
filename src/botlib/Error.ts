


export const errorKoList: string[] =[
    "Request failed with status code 500",
    "Bad status on response: 500",
    "Request failed with status code 502",
    "Bad status on response: 502",
    "Request failed with status code 504",
    "Bad status on response: 504",
    "Request failed with status code 521",
    "Bad status on response: 521",
    "Request failed with status code 524",
    "Bad status on response: 524",
    "incorrect account sequence",
]
export const errorNeedCheckList: string[] =[
    "ECONNRESET",
    "Request failed with status code 429",
    "Bad status on response: 429",
    "Request failed with status code 520",
    "Bad status on response: 520",
    "was submitted but was not yet found on the chain",
]
export const timeoutList: string[] =[
    "was submitted but was not yet found on the chain",
]

export const errorAbortList: string[] =[
    "Swap min error",
    "insufficient fees",
]



export class Error{

    exception: any

    constructor(exception: any){
        this.exception=exception
    }


    isKo(){
        for(let error of errorKoList){
            if(this.exception.message.includes(error)){
                return true
            }
        }
        return false
    }

    isNotSure(){
        for(let error of errorNeedCheckList){
            if(this.exception.message.includes(error)){
                return true
            }
        }
        return false
    }
    isTimeout(){
        let isTimeout = false
        for(let error of timeoutList){
            if(this.exception.message.includes(error)){
                return true
            }
        }
        return false
    }
    

    getTxHashFromTimeoutMessage(){
        let before= "with ID "
        let after = " was submitted"
        let beforeIndex = this.exception.message.indexOf(before)
        let afterIndex = this.exception.message.indexOf(after)
        if(beforeIndex !== -1 && afterIndex !== -1 && beforeIndex + before.length < afterIndex){
            return this.exception.message.substring(beforeIndex + before.length, afterIndex)
        }
        return ""
    }



    


    
}
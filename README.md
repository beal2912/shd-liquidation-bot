# Shade Liquidation Bot 

this typescript program executes liquidations on Shade Lend then execute a swap on shadeswap from the reward into Silk stable token   

It does not cost anything except SCRT gas to execute liquidations, and you receive 10% of the profits of all liquidations as a reward for liquidation risky positions and contributing to the security and decentralization of the protocol.

# Prerequis

this program was tested on Ubuntu 22.04.2 LTS with npm 8.19.3 and Node v19.1.0.
You need to setup your server before the next steps.

# Installation

1. clone the repo 

```
cd <your dir>
git clone git@github.com:beal2912/shd-liquidation-bot.git .
```

2. install the node dependency 
```
npm install
```
# Configuration

before running the program you need to duplicate/rename the .env_example file as .env and setup your info
```
cp .env_example .env
``` 

then in the file, set up your mnemonic, I recommend using Keplr to set up a new address used only by the bot
```
# your mnemonics
MNEMONICS="your 24 words mnemonics ..."
```



and your viewing keys in the TokenList "key" fields
```
TOKENLIST='{ "tokens": [
                { 
                    "name":"sstatom", 
                    "contract": "secret155w9uxruypsltvqfygh5urghd5v0zc6f9g69sq", 
                    "codehash": "638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e",
                    "decimals": 6,
                    "key":"76040b1d2ab5e077xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                    "min_amount": 0.1
                },
                ...
```
the viewing keys can be generated on the shade app by viewing your balance of each token in the portfolio tab
You also can retrieve it in Keplr (Secret Network > setting > tokens list)

# Run it

Run the program

you can launch it directly without compilation but it's slower and use more memory
```
ts-node src/index.ts
```

you can compile it then run it as javascript
```
tsc -p .
node build/index.js
```
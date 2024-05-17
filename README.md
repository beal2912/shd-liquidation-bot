# Shade Liquidation Bot 

this typescript bot executes liquidations on Shade Lend then execute a swap on shadeswap from the reward into Silk stable token   

It does not cost anything except SCRT gas to execute liquidations, and you receive 10% of the profits of all liquidations as a reward for liquidation risky positions and contributing to the security and decentralization of the protocol.

## Changelog
- 2024-05-17:
  - Rpc change + Websocket uri
  - no position bug with BTC vault
  - cosmjs packages update
- 2023-06-08: 
  - Using websocket to resquest vaults once per block 
  - Resqueting the vault in parallel instead of sequentially
  - Broadcasting a batch liquidations in case of multiple liquidation in a block

- 2023-05-15: first public version (HackSecret submission)

## Strategy
The strategy is quite basic, the bot load the vault ids at start then it request every x seconds if there is liquidatable positions on each vault.
If a liquidable position is found, the bot execute the contract to liquidate and receive the reward.
Afer that the bot check each balance and if a min amount of token is match, it execute a swap with the shade pool to transform the reward into $Silk.

If you don't want to swap the token you can disable it in the .env conf file.


## Development Deepdive

To develop this project I choose a very simple design pattern so the functions and the strategy is easily readable by any developer. 
The main process of the bot is in the index.ts and you have a file for each group of functions, 
* the secret wallet to query balances, 
* the trades/simulation on shade swap to transform the reward into $SILK, 
* the shade liquidation to query and liquidate

You have class / interface for more generic function like to calculate a valid swap path using the shade swap pools and managing the rpc errors.
these classes could easily be used for more complex arbitrage bot and other dapps like Sienna and SecretSwap.

while coding this bot I kept in mind to optimize memory / cpu / maintainability : 
* limiting the number of dependencies
* limiting the number and size of classes
* limiting the number of requests on the network

what could be improved in future versions:
* finding a better strategy to request less the vault, I could think of a gradient one, where we change the frequency of the request, when price are going down we request more and when price are going up we request less 



# Prerequis

this bot was tested on Ubuntu 22.04.2 LTS with npm 8.19.3 and Node v19.1.0.
You need to setup your server before the next steps.

this bot need a secret network account with at least 0.5 $scrt to pay for transaction fees.


# Installation

1. clone the repo 

```
cd <your dir>
git clone git@github.com:beal2912/shd-liquidation-bot.git .
```

2. install the node dependencies 
```
npm install
```
# Configuration

before running the bot you need to duplicate/rename the .env_example file as .env and setup your info
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
The viewing keys can be generated on the shade app by viewing your balance of each token in the portfolio tab
You also can retrieve it in Keplr (Secret Network > setting > tokens list)


To disable the swap function : just remove the min_amount field for ==each token== with the comma before to keep a valid json text.
```
TOKENLIST='{ "tokens": [
                { 
                    "name":"sstatom", 
                    "contract": "secret155w9uxruypsltvqfygh5urghd5v0zc6f9g69sq", 
                    "codehash": "638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e",
                    "decimals": 6,
                    "key":"76040b1d2ab5e077xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                },
                ...
```

# Run it

Run the bot

You can launch it directly without compilation but it's slower and use more memory
```
ts-node src/index.ts
```

You can compile it then run it as javascript
```
tsc -p .
node build/index.js
```
to stop the bot just use ctrl + c in linux or close the terminal

# set up the bot as a service 
this will allow you to run the bot 24/7

create a new file service file /etc/systemd/system/ named shd-liquidation.service 
you need to be root to edit the file
```
[Unit]
Description=shd-liquidation-bot
[Service]
PIDFile=/tmp/shd-liquidation-bot.pid
User=<your linux user>
Group=<your group>
Restart=always
KillSignal=SIGQUIT
WorkingDirectory=<path to your installation>
ExecStart=node <path to your installation>/build/index.js
[Install]
WantedBy=multi-user.target
```

```
# reload the service conf
sudo systemctl daemon-reload

# start the service 
sudo service shd-liquidation start
# stop the service
sudo service shd-liquidation stop
# restart the service 
sudo service shd-liquidation restart

# to follow what the service does with the log 
sudo journalctl -u shd-liquidation.service -f

# to debug the log 
sudo journalctl -u shd-liquidation.service

# if you want the service to start at boot 
sudo systemctl enable shd-liquidation.service

```
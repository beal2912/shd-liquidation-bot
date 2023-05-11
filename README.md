# Shade Liquidation Bot 

this typescript bot executes liquidations on Shade Lend then execute a swap on shadeswap from the reward into Silk stable token   

It does not cost anything except SCRT gas to execute liquidations, and you receive 10% of the profits of all liquidations as a reward for liquidation risky positions and contributing to the security and decentralization of the protocol.

## Strategy
The strategy is quite basic, the bot load the vault ids at start then it request every x seconds if there is liquidatable positions on each vault.
If a liquidable position is found, the bot execute the contract to liquidate and receive the reward.
Afer that the bot check each balance and if a min amount of token is match, it execute a swap with the shade pool to transform the reward into $Silk.

If you don't want to swap the token you can disable it in the .env conf file.



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
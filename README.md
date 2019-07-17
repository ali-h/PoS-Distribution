# PoS-Distribution
A Bot using Proof of Stake (PoS) for distributing Steem-Engine Tokens equally among Stakers.

It can be used with anykind of Token, and account which must holds the ammount of Reward pool as described.

## Configuration
Bot is easy to config, your will have to edit the `config.json` file according to your bot.

```javascript
{
    "username": "", // the username of the account which will do the distribution
    "keys" : {
        "active" : "" // active key of the account to do distribution
    },
    "token" : {
        "symbol" : "" // symbol of the Token, The stakers of this tokens will be rewarded
    },
    "distribution_hour" : 00, // distrubution happens daily, set it to 00 for 12:00 PM 
    "reward_pool" : 0, // the total Reward pool, it will be completely distributed 
    "isset" : false // set it true after configuring the bot
}
```
## Memo
`memo.md` File in th assets folder can be used to Send a memo to everyone in the distribution, there is a template already for it which is okay to user.
### Parameters
You can a date parameter in the memo which will be replaced by it's current value:
* `%date%` = > this will be replace by the current distribution date in the Memo.

## Logs
A Log file will be created in the `Logs` folder after every Distribution. it will contain all the information and actions happened in the distribution, a seprate log file will be genrated for every distribution named to the current date. the file will be in `JSON` format.

***

## Finalizing
Now install Dependencies and you can Run it
```javascript
$ npm install
$ node app.js
```

***

## Development
Bot is currently under Continous development and some things might be changed in the future, If you want to contribute or have any suggestions so you can Express them on my Discord `A-jaX#9816` or on Steemit @ali-h.

If you Encounter any issue or Bugs, Please report them [Here](https://github.com/alihassanah/PoS-Distribution/issues). Thanks!

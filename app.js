const steem = require('steem')
const colors = require('colors')
const config = require('./config.json')
const fs = require("fs")
const axios = require('axios')
const memo_temp = fs.readFileSync("./assets/memo.md", "utf-8")

function getAllStakers (callback) {
    var stakers = []
    var requestURL = "https://api.steem-engine.com/rpc/contracts"
    var request = {
        id: 1,
        jsonrpc: "2.0",
        method: "find",
        params: {
            contract: "tokens",
            indexes: "",
            offset: 0,
            query: {symbol: config.token.symbol},
            table: "balances"
        }
    }
    axios.post(requestURL, request)
    .then((res) => {
        var balances = res.data.result
        for(var i = 0; i <= balances.length - 1; i++) {
            this_balance = balances[i]
            if (this_balance.stake > 0) {
                var this_user = {
                    "username" : balances[i].account,
                    "stake" : balances[i].stake
                }
                stakers.push(this_user)                
            }
        }
        callback(stakers)
    })
    .catch((error) => {
        console.error(error)
    })
}

function getRewards (stakers, callback) {
    var totalStake = 0
    for (var i = 0; i <= stakers.length -1; i++) {
        totalStake = totalStake + parseInt(stakers[i].stake)
    }
    var rewards = {
        "details" : []        
    }
    for (var i = 0; i <= stakers.length -1; i++) {
        var this_staker = stakers[i]
        var pool_share = this_staker.stake / totalStake * 100
        var pool_reward = pool_share * config.reward_pool / 100
        var rewardOBJ = {
            "username" : this_staker.username,
            "share" : pool_share.toFixed(8) + "%",
            "stake" : this_staker.stake,
            "reward" : pool_reward.toFixed(8)
        }
        rewards.details.push(rewardOBJ)
    }
    var average = totalStake / stakers.length
    rewards["info"] = {
        "stakers" : stakers.length,
        "total_stake" : totalStake.toFixed(8),
        "reward_pool" : config.reward_pool.toFixed(8),
        "average_reward" : average.toFixed(8)
    }
    callback (rewards)
}

function initTimer () {
    console.log("---------------------------------------------------".yellow)
    var TimeTimer = (function() {    
        return setInterval(function() {
            currentTime = new Date().toLocaleString(undefined, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
            process.stdout.write("\rCURRENT LOCAL TIME : ".yellow + currentTime.green)
            var currentHour = new Date().getHours()
            if (currentHour == config.distribution_hour) {
                clearInterval(TimeTimer)
                console.log("\n")
                InitiateDistribution()
            }
        }, 1000);
    })()
}

function sendRewards(stakers, callback) {
    var memo = memo_temp.replace("%date%", new Date().toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }))
    var jsonOBJ = {
        "0" : []
    }
    var num = 0
    for(var i = 0; i <= stakers.length - 1; i++) {
        if (i%11 == 0 && i>1) {
            num++
            jsonOBJ[num] = []
        }
        var json = 	{
            "contractName":"tokens",
            "contractAction":"transfer",
            "contractPayload":{
                "symbol": config.token.symbol,
                "to": stakers.username,
                "quantity": stakers.reward,
                "memo": memo
            }
        }
        jsonOBJ[num].push(json)
    }
    console.log(jsonOBJ)
    // steem.broadcast.customJson(config.keys.active, [config.username], [], "ssc-mainnet1", JSON.stringify(json), function(err, result) {
    //     if (!err) {
    //         callback(true)
    //     }
    //     else {
    //         console.log("ERR".bgRed, "While Sending Rewards".yellow)
    //         callback(false)
    //     }
    // })
}

function InitiateDistribution () {
    setTimeout(function () {    
        console.log("DISTRIBUTION WAS CALLED, CURRENT TIME = ".yellow, new Date().toLocaleString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).green)
        console.log("NOW GETTING ALL STAKERS".yellow)
        console.log("")
        getAllStakers(function(stakers) {
            if (stakers.length > 0) {
                getRewards(stakers, function(rewards) {
                    console.log("---------------------------------------------------".yellow)
                    console.log("TOTAL STAKERS  : ".yellow, colors.green(rewards.info.stakers))
                    console.log("REWARD POOL    : ".yellow, colors.green(rewards.info.reward_pool))
                    console.log("TOTAL STAKE    : ".yellow, colors.green(rewards.info.total_stake))
                    console.log("AVERAGE REWARD : ".yellow, colors.green(rewards.info.average_reward))
                    console.log("---------------------------------------------------".yellow)
                    console.log("")
                    console.log("NOW SENDING REWARDS, PLEASE WAIT".yellow)
                    sendRewards(rewards.details, function (result) {
                        if (!result) {
                            console.log ("SOMETHING BAD HAPPENED".yellow)
                        }
                        else {
                            console.log("SUCCESS".green)
                            console.log("LOG FOR THIS DISTRIBUTION CAN BE FOUND IN DISTRIBUTIONS FOLDER".green)
                            console.log("")
                        }
                        setTimeout (function () {      
                            console.log("TIMER WILL AGAIN START IN 10 MINUTES".yellow)
                            console.log("")
                            setTimeout(function () {
                                initTimer()
                            }, 10 * 60 * 1000)
                        }, 1000)
                    })
                })
            }
            else {
                console.log("ERR".bgRed, "NO ONE IS STAKING".yellow, colors.green(config.token.symbol), "TOKEN, DISTRIBUTION FOR THIS DAY SKIPPED".yellow)
                console.log("TIMER WILL BEGIN IN 10 MINUTES".yellow)
                console.log("")
                setTimeout(function () {
                    initTimer()
                }, 10 * 60 * 1000)
            }
        })
    }, 2000)
}

console.log('\033[2J')
console.log("#---------------------------------#".green)
console.log("#        PoS - Distribution       #".green)
console.log("#---------------------------------#".green)
console.log("")

if (config.isset == false) {
	console.log(" ERR ".bgRed, "Please Configure the bot first, edit config.json file".yellow)
}
else {
    initTimer()
}
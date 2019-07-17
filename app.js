const steem = require('steem')
const colors = require('colors')
const config = require('./config.json')
const fs = require("fs")
const axios = require('axios')
const memo_temp = fs.readFileSync("./assets/memo.txt", "utf-8")
steem.api.setOptions({
    url: 'https://anyx.io'
})
var transferLOG = {}
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
    var average = config.reward_pool / stakers.length
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
            if (currentHour == config.distribution_hour && new Date().getMinutes() < 10) {
                clearInterval(TimeTimer)
                console.log("\n")
                InitiateDistribution()
            }
        }, 1000);
    })()
}

function sendRewards(stakers, callback) {
    var date = new Date().toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
    var memo = memo_temp.replace("%date%", date)
    var JSONsPerBlock = 25
    var total_batches = Math.ceil(stakers.length / JSONsPerBlock)
    console.log("DISTRIBUTION IS SEPRATED IN [".green, total_batches, "] BATCHE(S)".green)
    console.log("")
    var jsonARR = []
    var objectARR = []
    for (var i = 0; i <= total_batches - 1; i++) {
        jsonARR[i] = []
        objectARR[i] = []
    }
    var batch = 0
    for (var x = 0; x <= stakers.length - 1; x++) {
        if (x % JSONsPerBlock == 0 && x > 1) {
            batch++
        }
        var json = 	{
            "contractName":"tokens",
            "contractAction":"transfer",
            "contractPayload":{
                "symbol": config.token.symbol,
                "to": stakers[x].username,
                "quantity": stakers[x].reward,
                "memo": memo
            }
        }
        jsonARR[batch].push(json)
        objectARR[batch].push(stakers[x])
    }
    transferLOG["payload"] = []
    function doCustomJSON(batch_no) {        
        steem.broadcast.customJson(config.keys.active, [config.username], [], "ssc-mainnet1", JSON.stringify(jsonARR[batch_no - 1]), function(err, result) {
            var log = {}
            if (!err) {
                console.log("TRANSACTIONS COMPLETED FOR BATCH NO [".green, batch_no, "]".green)                
                log["log"] = "success"
            }
            else {
                console.log("ERR".bgRed, "While Sending Rewards to #Batch No [".yellow, batch_no ,"]".yellow)
                log["log"] = "failed"
            }
            log["batch_id"] = batch_no
            log["total_transactions"] = objectARR[batch_no - 1].length
            log["payload"] = objectARR[batch_no - 1]
            transferLOG.payload.push(log)         
            
            if (batch_no < jsonARR.length) {
                doCustomJSON(++batch_no)
            }
            else {
                var name = new Date()
                name = name.getMonth() + "-" + name.getDate() + "-" + name.getFullYear()
                fs.writeFile("./logs/"+ name +".json", JSON.stringify(transferLOG, null, "\t"), function(err) {
                    if (!err) {}
                    else
                        console.log("ERR".bgRed, "While Creating Log File".yellow)
                })
                callback(true)
            }
        })
    }
    doCustomJSON(1)
}

function InitiateDistribution () {
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
                transferLOG["total_stake"] = rewards.info.total_stake;
                transferLOG["reward_pool"] = rewards.info.reward_pool;
                transferLOG["total_stakers"] = rewards.info.stakers;
                sendRewards(rewards.details, function (result) {
                    console.log("")
                    console.log("SUCCESS - ALL TRANSACTIONS COMPLETED".green)
                    console.log("LOG FOR THIS DISTRIBUTION CAN BE FOUND IN LOGS FOLDER".green)
                    console.log("")
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

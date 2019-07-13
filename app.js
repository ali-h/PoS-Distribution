const steem = require('steem')
const colors = require('colors')
const config = require('./config.json')
const fs = require("fs")
const axios = require('axios')

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
        "total_stake" : totalStake.toFixed(8),
        "reward_pool" : config.reward_pool.toFixed(8),
        "average_reward" : average.toFixed(8)
    }
    callback (rewards)
}

getAllStakers(function(stakers) {
    if (stakers.length > 0) {
        getRewards(stakers, function(rewards) {
            console.log(rewards)
        })
    }
})
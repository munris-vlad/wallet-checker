import fs from "fs"
import axios from "axios"
import inquirer from "inquirer"
import { HttpsProxyAgent } from "https-proxy-agent"
import { SocksProxyAgent } from "socks-proxy-agent"
import { defineChain } from 'viem'
import crypto from "crypto"

export const wait = ms => new Promise(r => setTimeout(r, ms))
export const sleep = async (millis) => new Promise(resolve => setTimeout(resolve, millis))

export function random(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export function readWallets(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line !== '')
        return lines
    } catch (error) {
        console.error('Error reading the file:', error.message)
        return []
    }
}

export function writeLineToFile(filePath, line) {
    try {
        fs.appendFileSync(filePath, line + '\n', 'utf-8')
    } catch (error) {
        console.error('Error appending to the file:', error.message)
    }
}

export function getBalance(balance, decimal) {
    return parseFloat((parseInt(balance) / 10 ** decimal).toFixed(6))
}

export function timestampToDate(timestamp) {
    return new Date(parseInt(timestamp) * 1000)
}

export function compareVersions(version1, version2) {
    const parts1 = version1.split('.').map(Number)
    const parts2 = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0
        const part2 = parts2[i] || 0

        if (part1 < part2) return -1
        if (part1 > part2) return 1
    }

    return 0
}

Date.prototype.getWeek = function (dowOffset) {
    /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

    dowOffset = typeof (dowOffset) == 'number' ? dowOffset : 0 //default dowOffset to zero
    var newYear = new Date(this.getFullYear(), 0, 1)
    var day = newYear.getDay() - dowOffset //the day of week the year begins on
    day = (day >= 0 ? day : day + 7)
    var daynum = Math.floor((this.getTime() - newYear.getTime() -
        (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1
    var weeknum
    //if the year starts before the middle of a week
    if (day < 4) {
        weeknum = Math.floor((daynum + day - 1) / 7) + 1
        if (weeknum > 52) {
            let nYear = new Date(this.getFullYear() + 1, 0, 1)
            let nday = nYear.getDay() - dowOffset
            nday = nday >= 0 ? nday : nday + 7
            /*if the next year starts before the middle of
              the week, it is week #1 of that year*/
            weeknum = nday < 4 ? 1 : 53
        }
    }
    else {
        weeknum = Math.floor((daynum + day - 1) / 7)
    }
    return weeknum
}

export function getNativeToken(network) {
    let token = 'ETH'
    switch (network) {
        case 'Polygon':
            token = 'MATIC'
            break
        case 'polygon':
            token = 'MATIC'
            break
        case 'BSC':
            token = 'BNB'
            break
        case 'opBNB':
            token = 'BNB'
            break
        case 'Avalanche':
            token = 'AVAX'
            break
        case 'Core':
            token = 'CORE'
            break
        case 'Celo':
            token = 'CELO'
            break
        case 'Klaytn':
            token = 'KLAY'
            break
        case 'Fantom':
            token = 'FTM'
            break
        case 'Moonbeam':
            token = 'GLMR'
            break
        case 'Moonriver':
            token = 'MOVR'
            break
    }

    return token
}

export function balanceNative(balances, network) {
    return balances[network] && balances[network][getNativeToken(network)] ? balances[network][getNativeToken(network)] : '$0'
}

export function balance(balances, network, token) {
    return balances[network] && balances[network]['tokens'][token] ? balances[network]['tokens'][token] : '$0'
}

export function balanceTotal(totalBalances, network, token) {
    return totalBalances[network] && totalBalances[network][token] ?
        '$' + parseFloat(totalBalances[network][token].usd).toFixed(2) +
        ' / ' + parseFloat(totalBalances[network][token].amount).toFixed(3) +
        ' ' + totalBalances[network][token].symbol : '$0'
}

export function balanceTotalStable(totalBalances, network, token) {
    return totalBalances[network] && totalBalances[network][token] ?
        '$' + parseFloat(totalBalances[network][token].usd).toFixed(1) : '$0'
}

export function balanceTopToken(balances, network, iteration = 0) {
    if (balances[network] && balances[network]['tokens'] && Object.keys(balances[network]['tokens'])[iteration]) {
        let skip = 0
        let obj = balances[network]['tokens']
        if (obj[Object.keys(obj)[iteration]]) {
            if (obj[Object.keys(obj)[iteration]].includes('USD')) {
                skip = 1
            }
        }
        if (obj[Object.keys(obj)[iteration + 1]]) {
            if (obj[Object.keys(obj)[iteration + 1]].includes('USD')) {
                skip = 2
            }
        }

        return obj[Object.keys(obj)[iteration + skip]]
    }

    return ''
}

export async function getEthPriceForDate(date) {
    const ethereumId = "ethereum"
    const currency = "usd"
    const historicalPriceEndpoint = `https://api.coingecko.com/api/v3/coins/${ethereumId}/market_chart`
    let isDone = false
    while (!isDone) {
        try {
            const response = await axios.get(historicalPriceEndpoint, {
                params: {
                    vs_currency: currency,
                    from: date,
                    to: date,
                    interval: "daily",
                    days: 1
                }
            })

            await sleep(1000)

            if (response.data.prices && response.data.prices.length > 0) {
                isDone = true
                return response.data.prices[0][1]
            } else {
                return null
            }
        } catch (error) {
            await sleep(10 * 1000)
        }
    }
}

export async function getTokenPrice(token) {
    let price = 0
    let isFetched = false
    let retry = 0

    while (!isFetched) {
        const agent = getProxy(0, true)
        await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=USD`, {
            httpsAgent: agent
        }).then(response => {
            price = response.data.USD
            isFetched = true
        }).catch(e => {
            retry++

            if (retry > 3) {
                isFetched = true
            }
        })
    }

    return price
}

export async function getTokensPrice(tokens) {
    let prices = {}
    let isFetched = false
    let retry = 0

    while (!isFetched) {
        const agent = getProxy(0, true)
        await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${tokens}&tsyms=USD`, {
            httpsAgent: agent
        }).then(response => {
            prices = response.data
            isFetched = true
        }).catch(e => {
            retry++

            if (retry > 3) {
                isFetched = true
            }
        })
    }

    return prices
}

export const entryPoint = async () => {
    const questions = [
        {
            name: "choice",
            type: "list",
            message: "Action:",
            choices: [
                {
                    name: "Web version",
                    value: "web",
                },
                {
                    name: "Airdrop",
                    value: "airdrop",
                },
                {
                    name: "Points",
                    value: "points",
                },
                {
                    name: "Eclipse",
                    value: "eclipse",
                },
                {
                    name: "Morph",
                    value: "morph",
                },
                {
                    name: "Story",
                    value: "story",
                },
                {
                    name: "Jumper",
                    value: "jumper",
                },
                {
                    name: "ZkSync",
                    value: "zksync",
                },
                {
                    name: "Layerzero",
                    value: "layerzero",
                },
                {
                    name: "Debridge",
                    value: "debridge",
                },
                {
                    name: "Hyperlane",
                    value: "hyperlane",
                },
                {
                    name: "ZkBridge",
                    value: "zkbridge",
                },
                {
                    name: "Wormhole",
                    value: "wormhole",
                },
                {
                    name: "Zora",
                    value: "zora",
                },
                {
                    name: "Base",
                    value: "base",
                },
                {
                    name: "Polygon ZK EVM",
                    value: "polygonzkevm",
                },
                {
                    name: "Aptos",
                    value: "aptos",
                },
                {
                    name: "Linea",
                    value: "linea",
                },
                {
                    name: "Linea POH",
                    value: "linea-poh",
                },
                {
                    name: "Scroll",
                    value: "scroll",
                },
                {
                    name: "EVM checker",
                    value: "evm",
                },
                {
                    name: "Balances",
                    value: "balances",
                },
                {
                    name: "Rabby",
                    value: "rabby",
                },
                {
                    name: "Galxe",
                    value: "galxe",
                }
            ],
            default: "web",
            loop: false,
        },
    ]

    const answers = await inquirer.prompt(questions)
    return answers.choice
}

export const chooiceNetwork = async () => {
    const questions = [
        {
            name: "choice",
            type: "list",
            message: "Network:",
            choices: [
                {
                    name: "Ethereum",
                    value: "ETH",
                },
                {
                    name: "Arbitrum",
                    value: "Arbitrum",
                },
                {
                    name: "Optimism",
                    value: "Optimism",
                },
                {
                    name: "Linea",
                    value: "Linea",
                },
                {
                    name: "Polygon",
                    value: "Polygon",
                },
                {
                    name: "BSC",
                    value: "BSC",
                },
                {
                    name: "opBNB",
                    value: "opBNB",
                },
                {
                    name: "Avalanche",
                    value: "Avalanche",
                },

                {
                    name: "Base",
                    value: "Base",
                },
                {
                    name: "Core",
                    value: "Core",
                },
                {
                    name: "Celo",
                    value: "Celo",
                },
                {
                    name: "Klaytn",
                    value: "Klaytn",
                },
                {
                    name: "Fantom",
                    value: "Fantom",
                },
                {
                    name: "Moonbeam",
                    value: "Moonbeam",
                },
                {
                    name: "Moonriver",
                    value: "Moonriver",
                },
                {
                    name: "Manta",
                    value: "Manta",
                },
                {
                    name: "Zero",
                    value: "Zero",
                },
                {
                    name: "Ink",
                    value: "Ink",
                }
            ],
            default: "web",
            loop: false,
        },
    ]

    const answers = await inquirer.prompt(questions)
    return answers.choice
}

export const evmNetwork = async () => {
    const questions = [
        {
            name: "choice",
            type: "list",
            message: "Network:",
            choices: [
                {
                    name: "Ethereum",
                    value: "eth",
                },
                {
                    name: "Arbitrum",
                    value: "arbitrum",
                },
                {
                    name: "Optimism",
                    value: "optimism",
                },
                {
                    name: "Polygon",
                    value: "polygon",
                },
                {
                    name: "BSC",
                    value: "bsc",
                }
            ],
            default: "web",
            loop: false,
        },
    ]

    const answers = await inquirer.prompt(questions)
    return answers.choice
}

export const pointsChecker = async () => {
    const questions = [
        {
            name: "choice",
            type: "list",
            message: "Project:",
            choices: [
                {
                    name: "Zerion",
                    value: "zerion",
                },
            ],
            default: "zerion",
            loop: false,
        },
    ]

    const answers = await inquirer.prompt(questions)
    return answers.choice
}

export const airdropChecker = async () => {
    const questions = [
        {
            name: "choice",
            type: "list",
            message: "Project:",
            choices: [
                {
                    name: "Berachain (addresses/evm.txt)",
                    value: "berachain",
                },
                {
                    name: "Plume (addresses/evm.txt)",
                    value: "plume",
                },
                {
                    name: "Jupiter (addresses/solana.txt)",
                    value: "jupiter",
                },
            ],
            default: "berachain",
            loop: false,
        },
    ]

    const answers = await inquirer.prompt(questions)
    return answers.choice
}

export function getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value)
}

export function newAbortSignal(timeoutMs) {
    const abortController = new AbortController()
    setTimeout(() => abortController.abort(), timeoutMs || 0)

    return abortController.signal
}

let proxies = readWallets('./user_data/proxies.txt')

export function getProxy(index = 0, isRandom = true) {
    let agent
    let proxy = null
    if (proxies.length) {
        if (proxies[index]) {
            if (isRandom) {
                proxy = proxies[random(0, Math.max(proxies.length - 1, 0))]
            } else {
                proxy = proxies[index]
            }
        } else {
            proxy = proxies[0]
        }
    }

    if (proxy) {
        if (proxy.includes('http')) {
            agent = new HttpsProxyAgent(proxy)
        }

        if (proxy.includes('socks')) {
            agent = new SocksProxyAgent(proxy)
        }
    }

    return agent
}

export function getProxyAddress(index = 0, isRandom = false) {
    let proxy = null
    if (proxies.length) {
        if (proxies[index]) {
            if (isRandom) {
                proxy = proxies[random(0, proxies.length)]
            } else {
                proxy = proxies[index]
            }
        } else {
            proxy = proxies[0]
        }
    }

    return proxy
}

export function sortObjectByKey(obj) {
    const sortedEntries = Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0]))
    return Object.fromEntries(sortedEntries)
}

export const multicallAddress = '0xca11bde05977b3631167028862be2a173976ca11'

export const multicallAbi = [
    {
        "constant": true,
        "inputs": [],
        "name": "getCurrentBlockTimestamp",
        "outputs": [{ "name": "timestamp", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "components": [
                    { "name": "target", "type": "address" },
                    { "name": "callData", "type": "bytes" }
                ],
                "name": "calls",
                "type": "tuple[]"
            }
        ],
        "name": "aggregate",
        "outputs": [
            { "name": "blockNumber", "type": "uint256" },
            { "name": "returnData", "type": "bytes[]" }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getLastBlockHash",
        "outputs": [{ "name": "blockHash", "type": "bytes32" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "addr", "type": "address" }],
        "name": "getEthBalance",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getCurrentBlockDifficulty",
        "outputs": [{ "name": "difficulty", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getCurrentBlockGasLimit",
        "outputs": [{ "name": "gaslimit", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getCurrentBlockCoinbase",
        "outputs": [{ "name": "coinbase", "type": "address" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{ "name": "blockNumber", "type": "uint256" }],
        "name": "getBlockHash",
        "outputs": [{ "name": "blockHash", "type": "bytes32" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
]

export const erc20Abi = [
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
    'event UnBlacklisted(address indexed _account)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 value) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function transfer(address to, uint256 value) returns (bool)',
    'function transferFrom(address from, address to, uint256 value) returns (bool)',
]

export const redstone = /*#__PURE__*/ defineChain({
    id: 690,
    name: 'Redstone',
    network: 'redstone',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.redstonechain.com'],
            webSocket: ['wss://rpc.redstonechain.com'],
        },
        public: {
            http: ['https://rpc.redstonechain.com'],
            webSocket: ['wss://rpc.redstonechain.com'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Redstone',
            url: 'https://explorer.redstone.xyz',
        },
    }
})

export function generateRandomString(length) {
    const chars = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length)
        result += chars[randomIndex]
    }
    return result
}

export function generateFormattedString() {
    const part1 = generateRandomString(32)
    const part2 = generateRandomString(16)
    const part3 = generateRandomString(1)

    return `${part1}-${part2}-${part3}`
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58ToBuffer(base58) {
    let result = BigInt(0);
    for (const char of base58) {
        const index = BASE58_ALPHABET.indexOf(char);
        if (index === -1) {
            throw new Error(`Invalid Base58 character: ${char}`);
        }
        result = result * BigInt(58) + BigInt(index);
    }

    const hex = result.toString(16);
    const hexPadded = hex.length % 2 === 0 ? hex : '0' + hex;
    return Buffer.from(hexPadded, 'hex');
}

export function isEvmAddress(address) {
    if (!address.startsWith('0x') || address.length !== 42) {
        return false;
    }

    const hexPattern = /^[0-9a-fA-F]+$/
    return hexPattern.test(address.slice(2))
}


const prices = await getTokensPrice('APT,ETH,MATIC,BNB,AVAX,CORE,CELO,KLAY,FTM,GLMR,MOVR')
export const aptPrice = prices.APT ? prices.APT.USD : 0
export const ethPrice = prices.ETH ? prices.ETH.USD : 0
export const maticPrice = prices.MATIC ? prices.MATIC.USD : 0
export const bnbPrice = prices.BNB ? prices.BNB.USD : 0
export const avaxPrice = prices.AVAX ? prices.AVAX.USD : 0
export const corePrice = prices.CORE ? prices.CORE.USD : 0
export const celoPrice = prices.CELO ? prices.CELO.USD : 0
export const klayPrice = prices.KLAY ? prices.KLAY.USD : 0
export const ftmPrice = prices.FTM ? prices.FTM.USD : 0
export const glmrPrice = prices.GLMR ? prices.GLMR.USD : 0
export const movrPrice = prices.MOVR ? prices.MOVR.USD : 0

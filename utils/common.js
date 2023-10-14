import fs from "fs"
import axios from "axios"
import inquirer from "inquirer"

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

Date.prototype.getWeek = function (dowOffset) {
/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

    dowOffset = typeof(dowOffset) == 'number' ? dowOffset : 0 //default dowOffset to zero
    var newYear = new Date(this.getFullYear(),0,1)
    var day = newYear.getDay() - dowOffset //the day of week the year begins on
    day = (day >= 0 ? day : day + 7)
    var daynum = Math.floor((this.getTime() - newYear.getTime() -
    (this.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1
    var weeknum
    //if the year starts before the middle of a week
    if(day < 4) {
        weeknum = Math.floor((daynum+day-1)/7) + 1
        if(weeknum > 52) {
            let nYear = new Date(this.getFullYear() + 1,0,1)
            let nday = nYear.getDay() - dowOffset
            nday = nday >= 0 ? nday : nday + 7
            /*if the next year starts before the middle of
              the week, it is week #1 of that year*/
            weeknum = nday < 4 ? 1 : 53
        }
    }
    else {
        weeknum = Math.floor((daynum+day-1)/7)
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
        case 'Avalanche':
            token = 'AVAX'
            break
        case 'Core':
            token = 'CORE'
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
        '$'+parseFloat(totalBalances[network][token].usd).toFixed(2) +
        ' / ' + parseFloat(totalBalances[network][token].amount).toFixed(3) +
        ' ' + totalBalances[network][token].symbol : '$0'
}

export function balanceTotalStable(totalBalances, network, token) {
    return totalBalances[network] && totalBalances[network][token] ?
        '$'+parseFloat(totalBalances[network][token].usd).toFixed(1) : '$0'
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

        return obj[Object.keys(obj)[iteration+skip]]
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

let chromeV = random(100, 114)
export const starknetApiUrl = "https://graphql.starkscancdn.com/"
export const starknetAccountQuery = "query AccountCallsTableQuery(\n  $first: Int!\n  $after: String\n  $input: CallsInput!\n) {\n  ...AccountCallsTablePaginationFragment_calls_2DAjA4\n}\n\nfragment AccountCallsTablePaginationFragment_calls_2DAjA4 on Query {\n  calls(first: $first, after: $after, input: $input) {\n    edges {\n      node {\n        id\n        ...AccountCallsTableRowFragment_call\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AccountCallsTableRowFragment_call on Call {\n  call_id\n  block_number\n  transaction_hash\n  selector\n  contract_address\n  contract_identifier\n  contract {\n    is_social_verified\n    id\n  }\n  timestamp\n  selector_name\n  selector_identifier\n  calldata_decoded\n  calldata\n}\n"
export const starknetTransfersQuery = `
query ERC20TransferEventsTableQuery(
    $first: Int!
    $after: String
    $input: ERC20TransferEventsInput!
  ) {
    ...ERC20TransferEventsTablePaginationFragment_erc20TransferEvents_2DAjA4
  }
  
  fragment ERC20TransferEventsTablePaginationFragment_erc20TransferEvents_2DAjA4 on Query {
    erc20TransferEvents(first: $first, after: $after, input: $input) {
      edges {
        node {
          id
          ...ERC20TransferEventsTableRowFragment_erc20TransferEvent
          __typename
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
  
  fragment ERC20TransferEventsTableRowFragment_erc20TransferEvent on ERC20TransferEvent {
    id
    transaction_hash
    call_invocation_type
    from_address
    from_erc20_identifier
    from_contract {
      is_social_verified
      id
    }
    transfer_from_address
    transfer_from_identifier
    transfer_from_contract {
      is_social_verified
      id
    }
    transfer_to_address
    transfer_to_identifier
    transfer_to_contract {
      is_social_verified
      id
    }
    transfer_amount
    transfer_amount_display
    timestamp
    main_call {
      selector_identifier
      id
    }
  }  
`

export const starknetTxQuery = `
query TransactionsTableQuery(
    $first: Int!
    $after: String
    $input: TransactionsInput!
  ) {
    ...TransactionsTablePaginationFragment_transactions_2DAjA4
  }
  
  fragment TransactionsTableExpandedItemFragment_transaction on Transaction {
    entry_point_selector_name
    calldata_decoded
    entry_point_selector
    calldata
    initiator_address
    initiator_identifier
    main_calls {
      selector
      selector_name
      calldata_decoded
      selector_identifier
      calldata
      contract_address
      contract_identifier
      id
    }
  }
  
  fragment TransactionsTablePaginationFragment_transactions_2DAjA4 on Query {
    transactions(first: $first, after: $after, input: $input) {
      edges {
        node {
          id
          ...TransactionsTableRowFragment_transaction
          __typename
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
  
  fragment TransactionsTableRowFragment_transaction on Transaction {
    id
    transaction_hash
    block_number
    transaction_status
    transaction_type
    timestamp
    initiator_address
    initiator_identifier
    initiator {
      is_social_verified
      id
    }
    main_calls {
      selector_identifier
      id
    }
    ...TransactionsTableExpandedItemFragment_transaction
  }  
`

export const starknetBalanceQuery = `
query ERC20BalancesByOwnerAddressTableQuery(
    $input: ERC20BalancesByOwnerAddressInput!
  ) {
    erc20BalancesByOwnerAddress(input: $input) {
      id
      ...ERC20BalancesByOwnerAddressTableRowFragment_erc20Balance
    }
  }
  
  fragment ERC20BalancesByOwnerAddressTableRowFragment_erc20Balance on ERC20Balance {
    id
    contract_address
    contract_erc20_identifier
    contract_erc20_contract {
      symbol
      is_social_verified
      icon_url
      id
    }
    balance_display
  }
  `



export const starknetHeaders = [
    'Content-Type: application/json',
    'Accept: application/json',
    'origin: https://starkscan.co',
    'referer: https://starkscan.co/',
    'authority: graphql.starkscancdn.com',
    'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'sec-ch-ua: "Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
    'sec-ch-ua-mobile: ?0',
    'sec-ch-ua-platform: "macOS"',
    'sec-fetch-dest: empty',
    'sec-fetch-mode: cors',
    'sec-fetch-site: cross-site'
]

export const entryPoint = async () => {
    const questions = [
        {
            name: "choice",
            type: "list",
            message: "Действие:",
            choices: [
                {
                    name: "Веб версия",
                    value: "web",
                },
                {
                    name: "ZkSync",
                    value: "zksync",
                },
                {
                    name: "Starknet",
                    value: "starknet",
                },
                {
                    name: "Layerzero",
                    value: "layerzero",
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
                    name: "Aptos",
                    value: "aptos",
                },
                {
                    name: "Linea",
                    value: "linea",
                },
                {
                    name: "EVM checker",
                    value: "evm",
                },
                {
                    name: "Балансы",
                    value: "balances",
                },
                // {
                //     name: "Фильтр балансов",
                //     value: "filter",
                // },
                // {
                //     name: "Фильтр NFT",
                //     value: "nft",
                // },
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
            message: "Сеть:",
            choices: [
                {
                    name: "All",
                    value: "all",
                },
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
                    name: "Polygon",
                    value: "Polygon",
                },
                {
                    name: "BSC",
                    value: "BSC",
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
            message: "Сеть:",
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

export function getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value)
}
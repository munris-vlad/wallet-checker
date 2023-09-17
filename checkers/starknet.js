import '../utils/common.js'
import {
    readWallets,
    starknetApiUrl, starknetBalanceQuery,
    starknetHeaders, starknetTransfersQuery, starknetTxQuery,
} from '../utils/common.js'
import axios from "axios"
import {Table} from 'console-table-printer'
import {createObjectCsvWriter} from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'

let ethPrice = 0
await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then(response => {
    ethPrice = response.data.USD
})

let columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right'},
    { name: 'USDC', alignment: 'right'},
    { name: 'USDT', alignment: 'right'},
    { name: 'DAI', alignment: 'right'},
    { name: 'Volume', alignment: 'right'},
    { name: 'TX Count', alignment: 'right'},
    { name: 'Contracts', alignment: 'right'},
    { name: 'Bridge to / from', alignment: 'right'},
    { name: 'Days', alignment: 'right'},
    { name: 'Weeks', alignment: 'right'},
    { name: 'Months', alignment: 'right'},
    { name: 'Total gas spent', alignment: 'right', color: 'cyan'},
    { name: 'First tx', alignment: 'right'},
    { name: 'Last tx', alignment: 'right'},
]

let headers = [
    { id: 'n', title: '№'},
    { id: 'wallet', title: 'wallet'},
    { id: 'ETH', title: 'ETH'},
    { id: 'USDC', title: 'USDC'},
    { id: 'USDT', title: 'USDT'},
    { id: 'DAI', title: 'DAI'},
    { id: 'Volume', title: 'Volume'},
    { id: 'TX Count', title: 'TX Count'},
    { id: 'Contracts', title: 'Contracts'},
    { id: 'Bridge to / from', title: 'Bridge to / from'},
    { id: 'Days', title: 'Days'},
    { id: 'Weeks', title: 'Weeks'},
    { id: 'Months', title: 'Months'},
    { id: 'Total gas spent', title: 'Total gas spent'},
    { id: 'First tx', title: 'First tx'},
    { id: 'Last tx', title: 'Last tx'},
]

const csvWriter = createObjectCsvWriter({
    path: './results/starknet.csv',
    header: headers
})

const p = new Table({
    columns: columns,
    sort: (row1, row2) => +row1.n - +row2.n
})

let stats = []
let jsonData = []
const filterSymbol = ['ETH', 'USDT', 'USDC', 'DAI']

const contracts = [
    {
        name: 'ETH',
        address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        decimals: 18
    },
    {
        name: 'wstETH',
        address: '0x042b8f0484674ca266ac5d08e4ac6a3fe65bd3129795def2dca5c34ecc5f96d2',
        decimals: 18
    },
    {
        name: 'ETH bridge',
        address: '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
        decimals: 18
    },
    {
        name: 'DAI',
        address: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3',
        decimals: 18
    },
    {
        name: 'USDC',
        address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
        decimals: 6
    },
    {
        name: 'USDT',
        address: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
        decimals: 6
    }
]

async function getBalances(wallet) {
    filterSymbol.forEach(symbol => {
        stats[wallet].balances[symbol] = 0
    })

    let parseBalances = await fetch(starknetApiUrl, {
        method: "POST",
        headers: starknetHeaders,
        body: JSON.stringify({
            query: starknetBalanceQuery,
            variables: {
                input: { owner_address: wallet },
            },
        }),
    })

    let balancesParse = await parseBalances.json()

    if (balancesParse.data) {
        const balances = balancesParse.data.erc20BalancesByOwnerAddress

        if (balances) {
            Object.values(balances).forEach(balance => {
                if (filterSymbol.includes(balance.contract_erc20_contract.symbol)) {
                    stats[wallet].balances[balance.contract_erc20_contract.symbol] = balance.balance_display
                }
            })
        }
    }
}

async function getTxs(wallet) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()
    const uniqueContracts = new Set()

    let totalGasUsed = 0
    let volume = 0
    let txs = []
    let transfers = []

    let parseTransactions = await fetch(starknetApiUrl, {
        method: "POST",
        headers: starknetHeaders,
        body: JSON.stringify({
            query: starknetTxQuery,
            variables: {
                'first': 1000,
                'after': null,
                'input': {
                    'initiator_address': wallet,
                    'sort_by': 'timestamp',
                    'order_by': 'desc',
                    'min_block_number': null,
                    'max_block_number': null,
                    'min_timestamp': null,
                    'max_timestamp': null
                }
            },
        }),
    })

    let transactions = await parseTransactions.json()
    if (transactions.data) {
        txs = transactions.data.transactions.edges
    }

    let parseTransfers = await fetch(starknetApiUrl, {
        method: "POST",
        headers: starknetHeaders,
        body: JSON.stringify({
            query: starknetTransfersQuery,
            variables: {
                'first': 30,
                'after': null,
                'input': {
                    'transfer_from_or_to_address': wallet,
                    'sort_by': 'timestamp',
                    'order_by': 'desc'
                }
            },
        }),
    })

    let transfersData = await parseTransfers.json()
    if (transfersData.data) {
        transfers = transfersData.data.erc20TransferEvents.edges
    }

    if (txs.length) {
        stats[wallet].txcount = txs.length

        for (const tx of Object.values(txs)) {
            const date = new Date(tx.node.timestamp * 1000)
            uniqueDays.add(date.toDateString())
            uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
            uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())

            if (tx.node.actual_fee) {
                totalGasUsed += parseInt(tx.node.actual_fee) / Math.pow(10, 18)
            }

            if (tx.node.main_calls) {
                for (const call of Object.values(tx.node.main_calls)) {
                    uniqueContracts.add(call.contract_address)
                    contracts.forEach(contract => {
                        if (call.contract_address === contract.address) {
                            for (const data of Object.values(call.calldata_decoded)) {
                                if (data.name === 'amount') {
                                    let txVolume
                                    let value
                                    if (typeof data.value === 'string') {
                                        value = data.value
                                    } else {
                                        value = data.value[0].value
                                    }

                                    if (contract.name.includes('ETH')) {
                                        txVolume = (parseInt(value, 16) / Math.pow(10, contract.decimals)) * ethPrice
                                        if (txVolume > 10000) { txVolume = 0 }
                                    } else {
                                        txVolume = parseInt(value, 16) / Math.pow(10, contract.decimals)
                                    }
                                    volume += parseFloat(txVolume.toFixed(4))
                                }
                            }
                        }
                    })
                }
            }
        }

        let bridgeTo = 0
        let bridgeFrom = 0
        for (const transfer of Object.values(transfers)) {
            if (transfer.node.transfer_from_address === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                bridgeTo++
            }

            if (transfer.node.transfer_to_address === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                bridgeFrom++
            }
        }

        const numUniqueDays = uniqueDays.size
        const numUniqueWeeks = uniqueWeeks.size
        const numUniqueMonths = uniqueMonths.size
        const numUniqueContracts = uniqueContracts.size

        stats[wallet].first_tx_date = new Date(txs[txs.length - 1].node.timestamp*1000)
        stats[wallet].last_tx_date = new Date(txs[0].node.timestamp*1000)
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].unique_contracts = numUniqueContracts
        stats[wallet].total_gas = totalGasUsed
        stats[wallet].volume = volume
        stats[wallet].bridge_to = bridgeTo
        stats[wallet].bridge_from = bridgeFrom
    }
}

async function fetchWallet(wallet, index) {
    stats[wallet] = {
        balances: []
    }

    await getBalances(wallet)
    await getTxs(wallet)
    progressBar.update(iteration)

    total.gas += stats[wallet].total_gas
    total.eth += parseFloat(stats[wallet].balances['ETH'])
    total.usdt += parseFloat(stats[wallet].balances['USDT'])
    total.usdc += parseFloat(stats[wallet].balances['USDC'])
    total.dai += parseFloat(stats[wallet].balances['DAI'])

    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)
    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)
    let row

    row = {
        n: index,
        wallet: wallet,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount ?? 0,
        'Volume': stats[wallet].volume ? '$'+stats[wallet].volume?.toFixed(2) : '$'+0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to / from': `${stats[wallet].bridge_to} / ${stats[wallet].bridge_from}`,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? moment(stats[wallet].first_tx_date).format("DD.MM.YY") : '—',
        'Last tx': stats[wallet].txcount ? moment(stats[wallet].last_tx_date).format("DD.MM.YY") : '—',
    }

    if (stats[wallet].total_gas > 0) {
        row['Total gas spent'] = stats[wallet].total_gas.toFixed(4)  + ` ($${usdGasValue})`
    }

    if (stats[wallet].txcount) {
        p.addRow(row, { color: "cyan" })
    } else {
        p.addRow(row, { color: "red" })
    }

    jsonData.push({
        n: index,
        wallet: wallet,
        'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4),
        'ETH USDVALUE': usdEthValue,
        'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
        'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
        'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
        'TX Count': stats[wallet].txcount ?? 0,
        'Volume': stats[wallet].volume ? stats[wallet].volume?.toFixed(2) : 0,
        'Contracts': stats[wallet].unique_contracts ?? 0,
        'Bridge to / from': `${stats[wallet].bridge_to} / ${stats[wallet].bridge_from}`,
        'Days': stats[wallet].unique_days ?? 0,
        'Weeks': stats[wallet].unique_weeks ?? 0,
        'Months': stats[wallet].unique_months ?? 0,
        'First tx': stats[wallet].txcount ? stats[wallet].first_tx_date : '—',
        'Last tx': stats[wallet].txcount ? stats[wallet].last_tx_date : '—',
        'Total gas spent': stats[wallet].total_gas ? stats[wallet].total_gas.toFixed(4) : 0,
        'Total gas spent USDVALUE': stats[wallet].total_gas ? usdGasValue : 0
    })

    iteration++
}

let wallets = readWallets('./addresses/starknet.txt')
let iterations = wallets.length
let iteration = 1
let csvData = []
let total = {
    eth: 0,
    usdc: 0,
    usdt: 0,
    dai: 0,
    gas: 0
}

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function fetchWallets() {
    const walletPromises = wallets.map((account, index) => fetchWallet(account, index+1))
    return Promise.all(walletPromises)
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })

    csvWriter.writeRecords(csvData).then().catch()
}

export async function starknetFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    progressBar.stop()

    p.addRow({})

    let row = {
        wallet: 'Total',
        'ETH': total.eth.toFixed(4) + ` ($${(total.eth*ethPrice).toFixed(2)})`,
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'TX Count': '',
        'Days': '',
        'Weeks': '',
        'Months': '',
        'First tx': '',
        'Last tx': '',
    }

    if (total.gas > 0) {
        row['Total gas spent'] = total.gas.toFixed(4)  + ` ($${(total.gas*ethPrice).toFixed(2)})`
    }

    p.addRow(row, { color: "cyan" })

    await saveToCsv()

    p.printTable()
}

export async function starknetData() {
    wallets = readWallets('./addresses/starknet.txt')
    jsonData = []
    total = {
        eth: 0,
        usdc: 0,
        usdt: 0,
        dai: 0,
        gas: 0,
        lite_eth: 0
    }

    await fetchWallets()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'ETH': total.eth.toFixed(4),
        'ETH USDVALUE': (total.eth*ethPrice).toFixed(2),
        'USDC': total.usdc.toFixed(2),
        'USDT': total.usdt.toFixed(2),
        'DAI': total.dai.toFixed(2),
        'TX Count': '',
        'Days': '',
        'Weeks': '',
        'Months': '',
        'First tx': '',
        'Last tx': '',
        'Total gas spent': total.gas > 0 ? total.gas.toFixed(4) : 0,
        'Total gas spent USDVALUE': total.gas > 0 ? (total.gas*ethPrice).toFixed(2) : 0
    })

    return jsonData
}
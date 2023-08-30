import './common.js'
import {readWallets, sleep, timestampToDate} from './common.js'
import axios from "axios"
import {Table} from 'console-table-printer'
import {createObjectCsvWriter} from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import {HttpsProxyAgent} from "https-proxy-agent"

const csvWriter = createObjectCsvWriter({
    path: './results/starknet.csv',
    header: [
        { id: 'n', title: '№'},
        { id: 'wallet', title: 'wallet'},
        { id: 'ETH', title: 'ETH'},
        { id: 'USDC', title: 'USDC'},
        { id: 'USDT', title: 'USDT'},
        { id: 'DAI', title: 'DAI'},
        { id: 'TX Count', title: 'TX Count'},
        { id: 'Unique days', title: 'Unique days'},
        { id: 'Unique weeks', title: 'Unique weeks'},
        { id: 'Unique months', title: 'Unique months'},
        { id: 'First tx', title: 'First tx'},
        { id: 'Last tx', title: 'Last tx'},
        { id: 'Total gas spent', title: 'Total gas spent'}
    ]
});

const p = new Table({
  columns: [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'ETH', alignment: 'right', color: 'cyan'},
    { name: 'USDC', alignment: 'right', color: 'cyan'},
    { name: 'USDT', alignment: 'right', color: 'cyan'},
    { name: 'DAI', alignment: 'right', color: 'cyan'},
    { name: 'TX Count', alignment: 'right', color: 'cyan'},
    { name: 'Unique days', alignment: 'right', color: 'cyan'},
    { name: 'Unique weeks', alignment: 'right', color: 'cyan'},
    { name: 'Unique months', alignment: 'right', color: 'cyan'},
    { name: 'First tx', alignment: 'right', color: 'cyan'},
    { name: 'Last tx', alignment: 'right', color: 'cyan'},
    { name: 'Total gas spent', alignment: 'right', color: 'cyan'},
  ]
})

const apiUrl = "https://voyager.online/api"

let stats = []
const filterSymbol = ['ETH', 'USDT', 'USDC', 'DAI']

async function getBalances(wallet, proxy= null) {
    let isBalancesFetched = false
    let config = {}
    if (proxy) {
        config.httpsAgent = new HttpsProxyAgent(proxy)
    }

    while (!isBalancesFetched) {
        await axios.get(apiUrl + '/contract/' + wallet + '/balances', config).then(async response => {
            let balances = response.data
            stats[wallet].balances = []

            filterSymbol.forEach(symbol => {
                stats[wallet].balances[symbol] = 0
            })

            if (balances) {
                isBalancesFetched = true
                Object.values(balances).forEach(balance => {
                    if (filterSymbol.includes(balance.symbol)) {
                        stats[wallet].balances[balance.symbol] = balance.amount
                    }
                })
            }
            await sleep(1.5 * 1000)
        }).catch(async function (error) {
            await sleep(3 * 1000)
        })
    }
}

async function getTxs(wallet, proxy) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()

    let totalGasUsed = 0
    let txs = []
    let isAllTxCollected = false

    let config = {
        params: {
            to: wallet,
            p: 1,
            ps: 100
        }
    }

    if (proxy) {
        config.httpsAgent = new HttpsProxyAgent(proxy)
    }

    while (!isAllTxCollected) {
        await axios.get(apiUrl + '/txns', config).then(async response => {
            let items = response.data.items
            let lastPage = response.data.lastPage
            Object.values(items).forEach(tx => {
                txs.push(tx)
            })

            if (config.params.p === lastPage) {
                isAllTxCollected = true
            } else {
                config.params.p++
            }
            await sleep(1.5 * 1000)
        }).catch(async function (error) {
            await sleep(3 * 1000)
        })
    }

    stats[wallet].txcount = txs.length

    Object.values(txs).forEach(tx => {
        const date = new Date(timestampToDate(tx.timestamp))
        uniqueDays.add(date.toDateString())
        uniqueWeeks.add(date.getFullYear() + '-' + date.getWeek())
        uniqueMonths.add(date.getFullYear() + '-' + date.getMonth())
        totalGasUsed += parseInt(tx.actual_fee) / Math.pow(10, 18)
    })

    const numUniqueDays = uniqueDays.size
    const numUniqueWeeks = uniqueWeeks.size
    const numUniqueMonths = uniqueMonths.size

    if (txs.length) {
        stats[wallet].first_tx_date = new Date(timestampToDate(txs[txs.length - 1].timestamp))
        stats[wallet].last_tx_date = new Date(timestampToDate(txs[0].timestamp))
        stats[wallet].unique_days = numUniqueDays
        stats[wallet].unique_weeks = numUniqueWeeks
        stats[wallet].unique_months = numUniqueMonths
        stats[wallet].total_gas = totalGasUsed
    }
}

let ethPrice = 0
await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then(response => {
    ethPrice = response.data.USD
})

const wallets = readWallets('./addresses/starknet.txt')
const proxies = readWallets('./proxy.txt')
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

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
progressBar.start(iterations, 0);

for (let wallet of wallets) {
    stats[wallet] = {}
    let proxy = null
    if (proxies.length && proxies[iteration-1]) {
        proxy = proxies[iteration-1]
    }

    await getBalances(wallet, proxy)
    await sleep(4 * 1000)
    await getTxs(wallet, proxy)
    await sleep(4 * 1000)
    progressBar.update(iteration);

    total.gas += stats[wallet].total_gas
    total.eth += parseFloat(stats[wallet].balances['ETH'])
    total.usdt += parseFloat(stats[wallet].balances['USDT'])
    total.usdc += parseFloat(stats[wallet].balances['USDC'])
    total.dai += parseFloat(stats[wallet].balances['DAI'])

    let usdEthValue = (stats[wallet].balances['ETH']*ethPrice).toFixed(2)
    let usdGasValue = (stats[wallet].total_gas*ethPrice).toFixed(2)
    let row
    if (stats[wallet].txcount) {
        row = {
            n: iteration,
            wallet: wallet,
            'ETH': parseFloat(stats[wallet].balances['ETH']).toFixed(4) + ` ($${usdEthValue})`,
            'USDC': parseFloat(stats[wallet].balances['USDC']).toFixed(2),
            'USDT': parseFloat(stats[wallet].balances['USDT']).toFixed(2),
            'DAI': parseFloat(stats[wallet].balances['DAI']).toFixed(2),
            'TX Count': stats[wallet].txcount,
            'Unique days': stats[wallet].unique_days,
            'Unique weeks': stats[wallet].unique_weeks,
            'Unique months': stats[wallet].unique_months,
            'First tx': moment(stats[wallet].first_tx_date).format("DD.MM.YY"),
            'Last tx': moment(stats[wallet].last_tx_date).format("DD.MM.YY"),
            'Total gas spent': stats[wallet].total_gas.toFixed(4)  + ` ($${usdGasValue})`
        }

        p.addRow(row)
    }

    iteration++

    if (!--iterations) {
        progressBar.stop();

        p.addRow({})

        row = {
            wallet: 'Total',
            'ETH': total.eth.toFixed(4) + ` ($${(total.eth*ethPrice).toFixed(2)})`,
            'USDC': total.usdc.toFixed(2),
            'USDT': total.usdt.toFixed(2),
            'DAI': total.dai.toFixed(2),
            'TX Count': '',
            'Unique days': '',
            'Unique weeks': '',
            'Unique months': '',
            'First tx': '',
            'Last tx': '',
            'Total gas spent': total.gas.toFixed(4)  + ` ($${(total.gas*ethPrice).toFixed(2)})`
        }

        p.addRow(row)

        p.printTable()

        p.table.rows.map((row) => {
            csvData.push(row.text);
        })

        csvWriter.writeRecords(csvData)
            .then(() => console.log('Запись в CSV файл завершена'))
            .catch(error => console.error('Произошла ошибка при записи в CSV файл:', error));
    }
}
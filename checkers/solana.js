import '../utils/common.js'
import {readWallets, getBalance, getProxy, solPrice, newAbortSignal, getKeyByValue} from '../utils/common.js'
import axios from "axios"
import { Table } from 'console-table-printer'
import { createObjectCsvWriter } from 'csv-writer'
import moment from 'moment'
import cliProgress from 'cli-progress'
import { HttpsProxyAgent } from "https-proxy-agent"
import { config } from '../user_data/config.js'
import { cleanByChecker, getWalletFromDB, saveWalletToDB } from '../utils/db.js'
import fetch from 'node-fetch';

const headers = [
    { id: 'n', title: '№'},
    { id: 'wallet', title: 'wallet'},
    { id: 'SOL', title: 'SOL'},
]

const columns = [
    { name: 'n', color: 'green', alignment: "right"},
    { name: 'wallet', color: 'green', alignment: "right"},
    { name: 'SOL', alignment: 'right', color: 'cyan'},
]

const apiUrl = "https://api.mainnet-beta.solana.com";

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('solana')
}

let p
let csvWriter
let stats = []
let jsonData = []
let wallets = readWallets(config.modules.solana.addresses)
let iterations = wallets.length
let iteration = 1
let csvData = []
let totalSol = 0
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function getBalances(publicKey) {
  console.log('Get balance for wallet:' + publicKey)
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [publicKey, { commitment: 'finalized' }]
      })
    });

    const data = await response.json();
    console.log('Данные ответа:', data, '- Время:', new Date().toLocaleString());
    return data.result.value;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
}

async function fetchWallet(wallet, index, isFetch = false) {
    await delay(1000);
    const existingData = await getWalletFromDB(wallet, 'solana')
    if (existingData && !isFetch) {
        stats[wallet] = JSON.parse(existingData)
    } else {
        stats[wallet] = {
            balance: 0,
            collection_count: 0,
            nft_count: 0
        }

        try {
            console.log("Call getBalances for " + wallet)
            stats[wallet].balance = await getBalances(wallet) / 1000000000
        } catch (error) {
            console.error(`Ошибка при запросе для ${publicKey}:`, error);
        }
    }

    progressBar.update(iteration)
    let usdSolValue = (stats[wallet].balance*solPrice).toFixed(2)
    console.log("usdSolValue = stats[wallet].balance(" + stats[wallet].balance + ")*solPrice(" + solPrice + ") = " + usdSolValue)
    let row
    totalSol += stats[wallet].balance
    row = {
        n: index,
        wallet: wallet,
        'SOL': stats[wallet].balance ? stats[wallet].balance.toFixed(4) + ` ($${usdSolValue})` : 0,
    }

    p.addRow(row)
    jsonData.push({
        n: index,
        wallet: wallet,
        'SOL': stats[wallet].balance ? stats[wallet].balance.toFixed(4) : 0,
        'SOL USDVALUE': usdSolValue,
    })

    if (stats[wallet].txcount > 0) {
        console.log('save wallet to DB ' + wallet)
        await saveWalletToDB(wallet, 'solana', JSON.stringify(stats[wallet]))
    }

    iteration++
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchWallets() {
    wallets = readWallets(config.modules.solana.addresses)
    iterations = wallets.length
    iteration = 1
    jsonData = []
    csvData = []
    totalSol = 0

    csvWriter = createObjectCsvWriter({
        path: './results/solana.csv',
        header: headers
    })

    p = new Table({
        columns: columns,
        sort: (row1, row2) => +row1.n - +row2.n
    })

    const walletPromises = wallets.map(async (account, index) => {
        // Добавляем задержку перед вызовом функции для создания интервала между запросами
        await wait(500 * index); // 1 секунда на каждом шаге
        return fetchWallet(account, index + 1);
    });

    //const walletPromises = wallets.map((account, index) => fetchWallet(account, index+1))
    return Promise.all(walletPromises)
}

async function saveToCsv() {
    p.table.rows.map((row) => {
        csvData.push(row.text)
    })
    csvData.sort((a, b) => a.n - b.n)
    csvWriter.writeRecords(csvData).then().catch()
}

async function addTotalRow() {
    p.addRow({})
    p.addRow({
        wallet: 'Total',
        'SOL': totalSol.toFixed(4) + ` ($${(totalSol*solPrice).toFixed(2)})`,
    })
}

export async function solanaFetchDataAndPrintTable() {
    progressBar.start(iterations, 0)
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()
    progressBar.stop()
    p.printTable()
}

export async function solanaData() {
    await fetchWallets()
    await addTotalRow()
    await saveToCsv()

    jsonData.push({
        wallet: 'Total',
        'SOL': totalSol.toFixed(4),
        'SOL USDVALUE': (totalSol*solPrice).toFixed(2),
    })

    return jsonData
}

export async function solanaFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function solanaClean() {
    await cleanByChecker('solana')
}
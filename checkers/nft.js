import Moralis from "moralis"
import { EvmChain } from "@moralisweb3/common-evm-utils"
import { readWallets, sleep, getKeyByValue, ethPrice, getProxy, newAbortSignal } from '../utils/common.js'
import cliProgress from "cli-progress"
import axios from "axios"
import { config } from '../user_data/config.js'
import { formatEther, formatUnits } from 'viem'
import { cleanByChecker, getCountByChecker, getWalletFromDB, saveWalletToDB } from "../utils/db.js"

const args = process.argv.slice(2)
if (args[1] === 'refresh') {
    cleanByChecker('nft')
}

let jsonData = []
let wallets = readWallets(config.modules.nft.addresses)
let nfts = []
let totalNftPrice = 0

async function fetchWallet(wallet, index, isFetch = false) {
    let agent = getProxy(index, true)
    nfts = []

    let total = 0
    const existingData = await getWalletFromDB(wallet, 'nft')
    if (existingData && !isFetch) {
        nfts = JSON.parse(existingData)
    } else {
        await axios.get(`https://api.rabby.io/v1/user/collection_list?id=${wallet}&is_all=false`, {
            httpsAgent: agent,
            signal: newAbortSignal(40000),
            headers: {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,ru;q=0.8,bg;q=0.7",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "none",
                "x-client": "Rabby",
                "x-version": "0.92.72"
            }
        }).then(response => {
            if (response.data) {
                nfts = response.data
            }
        }).catch(error => {
            if (config.debug) console.log(error.toString())
        })
    }

    if (nfts.length > 0) {
        await saveWalletToDB(wallet, 'nft', JSON.stringify(nfts))
    }

    const filteredNfts = nfts.filter(nft => {
        const price = (nft.floor_price * nft.nft_list.length) * nft.native_token.price
        return price > config.modules.nft.minCollectionPriceUSD
    })

    for (const nft of filteredNfts) {
        total += (nft.floor_price * nft.nft_list.length) * nft.native_token.price
    }

    totalNftPrice += total

    jsonData.push({
        n: parseInt(index) + 1,
        wallet: wallet,
        total: parseInt(total),
        data: filteredNfts
    })
}

async function fetchBatch(batch) {
    await Promise.all(batch.map((account, index) => fetchWallet(account, getKeyByValue(wallets, account))))
}

async function fetchWallets() {
    wallets = readWallets(config.modules.nft.addresses)
    jsonData = []
    nfts = []
    totalNftPrice = 0

    let batchSize = 1
    let timeout = 2000

    const walletsInDB = await getCountByChecker('nft')

    if (walletsInDB === wallets.length) {
        batchSize = walletsInDB
        timeout = 0
    }

    const batchCount = Math.ceil(wallets.length / batchSize)
    const walletPromises = []

    for (let i = 0; i < batchCount; i++) {
        const startIndex = i * batchSize
        const endIndex = (i + 1) * batchSize
        const batch = wallets.slice(startIndex, endIndex)

        const promise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(fetchBatch(batch))
            }, i * timeout)
        })

        walletPromises.push(promise)
    }

    return Promise.all(walletPromises)
}

export async function nftData() {
    await fetchWallets()
    jsonData.push({
        wallet: 'Total',
        total: parseInt(totalNftPrice),
        data: []
    })

    return jsonData
}

export async function nftFetchWallet(wallet) {
    return fetchWallet(wallet, getKeyByValue(wallets, wallet), true)
}

export async function nftClean() {
    await cleanByChecker('nft')
}
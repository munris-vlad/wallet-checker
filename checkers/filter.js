import { readWallets } from '../utils/common.js'
import { AnkrProvider } from '@ankr.com/ankr.js'
import dotenv from 'dotenv'

dotenv.config()

const provider = new AnkrProvider('https://rpc.ankr.com/multichain/'+process.env.ANKR_API_KEY)

const balances = async (address, index, network = 'eth', compare = '<', sum = '1', contract = null) => {
    const data = await provider.getAccountBalance({
        blockchain: network,
        walletAddress: address,
        onlyWhitelisted: true
    })

    if (data.totalBalanceUsd == 0 && compare == '<') {
        console.log(address)
    }

    data.assets.forEach((token) => {
        const isNativeToken = token.tokenType === 'NATIVE'
        const isMatchingContract = !contract || token.contractAddress === contract.toLowerCase()
        const balanceUsd = parseFloat(token.balanceUsd)

        if ((isNativeToken && !contract) &&
            ((compare === '<' && balanceUsd < sum) ||
            (compare === '>' && balanceUsd > sum))) {

            console.log(address)
        }

        if ((isMatchingContract && contract) &&
            ((compare === '<' && balanceUsd < sum) ||
            (compare === '>' && balanceUsd > sum))) {

            console.log(address)
        }
    })
}


const wallets = readWallets('./addresses/evm.txt')
const args = process.argv.slice(2)
const network = args[0]
const compare = args[1]
const sum = args[2]
const contract = args[3]

function fetchBalances() {
    const balancePromises = wallets.map((account, index) => balances(account, index, network, compare, sum, contract))
    return Promise.all(balancePromises)
}

export async function filterFetchDataAndPrintTable() {
    await fetchBalances()
}


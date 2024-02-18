import { dirname } from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import path from 'path'
import cors from 'cors'
import {zkSyncData} from "./checkers/zksync.js"
import {zoraData} from "./checkers/zora.js"
import {baseData} from "./checkers/base.js"
import {aptosData} from "./checkers/aptos.js"
import {lineaData} from "./checkers/linea.js"
import {scrollData} from "./checkers/scroll.js"
import {balancesData} from "./checkers/balances.js"
import {evmData} from "./checkers/evm.js"
import {readWallets} from "./utils/common.js"
import {layerzeroData} from "./checkers/layerzero.js"
import { wormholeData } from './checkers/wormhole.js'
import { zkbridgeData } from './checkers/zkbridge.js'
import { hyperlaneData } from './checkers/hyperlane.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = 80
const apiRoutes = express.Router()

app.use(cors())
app.use('/api', apiRoutes)

app.use(express.static(path.join(__dirname, '/web/dist')))

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/web/dist/index.html'))
})

apiRoutes.get('/stats', async (req, res) => {
    const zksyncWallets = readWallets('./addresses/zksync.txt')
    const layerzeroWallets = readWallets('./addresses/layerzero.txt')
    const wormholeWallets = readWallets('./addresses/wormhole.txt')
    const zkbridgeWallets = readWallets('./addresses/zkbridge.txt')
    const hyperlaneWallets = readWallets('./addresses/hyperlane.txt')
    const zoraWallets = readWallets('./addresses/zora.txt')
    const baseWallets = readWallets('./addresses/base.txt')
    const aptosWallets = readWallets('./addresses/aptos.txt')
    const lineaWallets = readWallets('./addresses/linea.txt')
    const scrollWallets = readWallets('./addresses/scroll.txt')
    const evmWallets = readWallets('./addresses/evm.txt')
    res.json({
        'zksync_wallets': zksyncWallets,
        'layerzero_wallets': layerzeroWallets,
        'zkbridge_wallets': zkbridgeWallets,
        'hyperlane_wallets': hyperlaneWallets,
        'wormhole_wallets': wormholeWallets,
        'zora_wallets': zoraWallets,
        'base_wallets': baseWallets,
        'aptos_wallets': aptosWallets,
        'linea_wallets': lineaWallets,
        'scroll_wallets': scrollWallets,
        'evm_wallets': evmWallets,
    })
})

apiRoutes.get('/zksync', async (req, res) => {
    const responseData = await zkSyncData()
    res.json(responseData)
})

apiRoutes.get('/wormhole', async (req, res) => {
    const responseData = await wormholeData()
    res.json(responseData)
})

apiRoutes.get('/layerzero', async (req, res) => {
    const responseData = await layerzeroData()
    res.json(responseData)
})

apiRoutes.get('/zkbridge', async (req, res) => {
    const responseData = await zkbridgeData()
    res.json(responseData)
})

apiRoutes.get('/hyperlane', async (req, res) => {
    const responseData = await hyperlaneData()
    res.json(responseData)
})

apiRoutes.get('/zora', async (req, res) => {
    const responseData = await zoraData()
    res.json(responseData)
})

apiRoutes.get('/base', async (req, res) => {
    const responseData = await baseData()
    res.json(responseData)
})

apiRoutes.get('/aptos', async (req, res) => {
    const responseData = await aptosData()
    res.json(responseData)
})

apiRoutes.get('/linea', async (req, res) => {
    const responseData = await lineaData()
    res.json(responseData)
})

apiRoutes.get('/scroll', async (req, res) => {
    const responseData = await scrollData()
    res.json(responseData)
})

apiRoutes.get('/balances', async (req, res) => {
    const network = req.query.network ? req.query.network : 'eth'
    const responseData = await balancesData(network)
    res.json(responseData)
})

apiRoutes.get('/evm', async (req, res) => {
    const network = req.query.network ? req.query.network : 'eth'
    const responseData = await evmData(network)
    res.json(responseData)
})

app.listen(port, () => {
  console.log(`Чекер запущен: http://localhost`)
})